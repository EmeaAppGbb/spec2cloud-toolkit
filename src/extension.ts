import * as vscode from 'vscode';
import { TemplatesViewProvider } from './providers/templatesViewProvider';
import { ResourcesViewProvider } from './providers/resourcesViewProvider';
import { GalleryViewProvider } from './providers/galleryViewProvider';
import { TemplateService } from './services/templateService';
import { ConfigurationService } from './services/configurationService';
import { MCPServer } from './mcp/mcpServer';

let templateService: TemplateService;
let templatesProvider: TemplatesViewProvider;
let galleryProvider: GalleryViewProvider;
let mcpServer: MCPServer;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Spec2Cloud Toolkit is now active');

    // Initialize services
    const configService = new ConfigurationService(context);
    templateService = new TemplateService(configService);

    // Initialize providers
    templatesProvider = new TemplatesViewProvider(context, templateService);
    const resourcesProvider = new ResourcesViewProvider(context, configService);
    galleryProvider = new GalleryViewProvider(context, templateService);

    // Register tree view providers
    vscode.window.registerTreeDataProvider('spec2cloud.templates', templatesProvider);
    vscode.window.registerTreeDataProvider('spec2cloud.resources', resourcesProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.viewTemplate', async (treeItem) => {
            // TreeItem has a 'template' property
            const template = (treeItem as any).template;
            if (template) {
                // Open gallery with template's title, category, industry and tech stack pre-filled
                await galleryProvider.show(
                    template.title, 
                    template.category, 
                    template.industry, 
                    template.languages || [],
                    template.services || [],
                    template.frameworks || []
                );
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.viewTemplateOnGitHub', async (treeItem) => {
            // TreeItem has a 'template' property
            const template = (treeItem as any).template;
            if (template) {
                await templateService.viewTemplateOnGitHub(template);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.useTemplate', async (treeItem) => {
            // TreeItem has a 'template' property
            const template = (treeItem as any).template;
            if (template) {
                await templateService.useTemplate(template);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.toggleView', async () => {
            await galleryProvider.show();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.authenticateGitHub', async () => {
            try {
                const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
                if (session) {
                    vscode.window.showInformationMessage('Successfully authenticated with GitHub! You can now use the extension without rate limits.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('Failed to authenticate with GitHub. Please try again.');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.openResource', async (resource) => {
            if (resource && resource.url) {
                await vscode.env.openExternal(vscode.Uri.parse(resource.url));
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.refresh', async () => {
            console.log('[Spec2Cloud] Refreshing templates...');
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Spec2Cloud Toolkit',
                cancellable: false
            }, async (progress) => {
                try {
                    // Clear cache to load fresh data from GitHub
                    templateService.clearCache();
                    progress.report({ message: 'Loading templates...' });
                    const allTemplates = await templateService.searchTemplates('', 'All', 'All', [], [], []);
                    templatesProvider.setTemplates(allTemplates);
                    console.log(`[Spec2Cloud] Loaded ${allTemplates.length} templates`);
                    progress.report({ message: `Loaded ${allTemplates.length} template(s)` });
                    
                    // Show completion message briefly
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error('[Spec2Cloud] Failed to refresh templates:', error);
                    if (error instanceof Error && !error.message.includes('rate limit')) {
                        vscode.window.showErrorMessage('Failed to refresh templates. Please check your configuration.');
                    }
                }
            });
        })
    );

    // Initialize MCP Server
    mcpServer = new MCPServer(context, templateService, templatesProvider);
    await mcpServer.initialize();

    // Show welcome message or load templates
    const config = vscode.workspace.getConfiguration('spec2cloud');
    const repoUrl = config.get('githubRepo') as string;
    
    if (!repoUrl) {
        const action = await vscode.window.showInformationMessage(
            'Welcome to Spec2Cloud Toolkit! Please configure your GitHub repository.',
            'Open Settings'
        );
        if (action === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'spec2cloud.githubRepo');
        }
    } else {
        // Automatically load all templates on startup with progress notification
        console.log('[Spec2Cloud] Loading all templates on startup...');
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Spec2Cloud Toolkit',
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: 'Loading templates...' });
                const allTemplates = await templateService.searchTemplates('', 'All', 'All', [], [], []);
                templatesProvider.setTemplates(allTemplates);
                console.log(`[Spec2Cloud] Loaded ${allTemplates.length} templates on startup`);
                progress.report({ message: `Loaded ${allTemplates.length} template(s)` });
                
                // Show completion message briefly
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('[Spec2Cloud] Failed to load templates on startup:', error);
                // Don't show error message if it's a rate limit error (already shown by templateService)
                if (error instanceof Error && !error.message.includes('rate limit')) {
                    vscode.window.showWarningMessage('Spec2Cloud: Failed to load templates. Check your repository configuration.');
                }
            }
        });
    }
}

export function deactivate() {
    if (mcpServer) {
        mcpServer.dispose();
    }
}
