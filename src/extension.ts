import * as vscode from 'vscode';
import { TemplateService } from './templateService';
import { GalleryViewProvider } from './galleryViewProvider';
import { TemplatesTreeProvider } from './templatesTreeProvider';
import { ResourcesTreeProvider } from './resourcesTreeProvider';
import { TemplateGalleryPanel } from './templateGalleryPanel';
import { McpToolsProvider } from './mcpToolsProvider';
import { SortOrder } from './types';

let templateService: TemplateService;
let templatesTreeProvider: TemplatesTreeProvider;
let resourcesTreeProvider: ResourcesTreeProvider;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Spec2Cloud Toolkit is now active');

    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('Spec2Cloud');
    context.subscriptions.push(outputChannel);
    outputChannel.appendLine('Spec2Cloud Toolkit activated');

    // Initialize services
    templateService = new TemplateService(outputChannel);
    
    // Register Gallery View Provider FIRST (before templates load)
    const galleryViewProvider = new GalleryViewProvider(
        context.extensionUri,
        () => {
            TemplateGalleryPanel.createOrShow(context.extensionUri, templateService);
        }
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            GalleryViewProvider.viewType,
            galleryViewProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Load templates after providers are registered
    outputChannel.appendLine('Loading templates...');
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading Spec2Cloud templates...',
        cancellable: false
    }, async () => {
        await templateService.loadTemplates();
    });

    // Register Templates Tree Provider
    templatesTreeProvider = new TemplatesTreeProvider(templateService);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('spec2cloud.templates', templatesTreeProvider)
    );
    templatesTreeProvider.refresh();

    // Register Resources Tree Provider
    resourcesTreeProvider = new ResourcesTreeProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('spec2cloud.resources', resourcesTreeProvider)
    );

    // Register MCP Tools
    const mcpToolsProvider = new McpToolsProvider(templateService, context.extensionUri);
    mcpToolsProvider.registerTools(context);

    // Register Commands

    // Open Gallery Command
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.openGallery', () => {
            TemplateGalleryPanel.createOrShow(context.extensionUri, templateService);
        })
    );

    // Refresh Templates Command
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.refreshTemplates', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refreshing templates...',
                cancellable: false
            }, async () => {
                await templateService.loadTemplates();
                templatesTreeProvider.refresh();
            });
            vscode.window.showInformationMessage('Templates refreshed successfully!');
        })
    );

    // Sort Templates by Name Command
    let currentNameSort = SortOrder.nameAsc;
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.sortTemplatesByName', () => {
            currentNameSort = currentNameSort === SortOrder.nameAsc ? SortOrder.nameDesc : SortOrder.nameAsc;
            templatesTreeProvider.setSortOrder(currentNameSort);
        })
    );

    // Sort Templates by Date Command
    let currentDateSort = SortOrder.dateNewest;
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.sortTemplatesByDate', () => {
            currentDateSort = currentDateSort === SortOrder.dateNewest ? SortOrder.dateOldest : SortOrder.dateNewest;
            templatesTreeProvider.setSortOrder(currentDateSort);
        })
    );

    // View Template on GitHub Command
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.viewTemplateOnGitHub', (treeItem) => {
            if (treeItem && treeItem.template) {
                vscode.env.openExternal(vscode.Uri.parse(treeItem.template.repoUrl));
            }
        })
    );

    // View Template in Gallery Command
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.viewTemplateInGallery', (treeItem) => {
            if (treeItem && treeItem.template) {
                TemplateGalleryPanel.createOrShow(context.extensionUri, templateService, treeItem.template.title);
            }
        })
    );

    // Use Template Command
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.useTemplate', async (treeItem) => {
            if (!treeItem || !treeItem.template) {
                return;
            }

            const template = treeItem.template;
            const answer = await vscode.window.showInformationMessage(
                `This will download all the template files to the current workspace. Continue?`,
                { modal: true },
                'Yes'
            );

            if (answer === 'Yes') {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showErrorMessage('No workspace folder is open');
                    return;
                }

                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Downloading template: ${template.title}`,
                    cancellable: false
                }, async () => {
                    await templateService.downloadTemplate(template, workspaceFolders[0].uri);
                });
            }
        })
    );

    // Open Resource Command
    context.subscriptions.push(
        vscode.commands.registerCommand('spec2cloud.openResource', (resource) => {
            if (resource) {
                resourcesTreeProvider.openResource(resource);
            }
        })
    );

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('spec2cloud.resources')) {
                resourcesTreeProvider.refresh();
            }
            if (e.affectsConfiguration('spec2cloud.templatesRepo')) {
                vscode.window.showInformationMessage(
                    'Templates repository changed. Reload to apply changes.',
                    'Reload'
                ).then(selection => {
                    if (selection === 'Reload') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
            }
        })
    );
}

export function deactivate() {
    // Cleanup code
}
