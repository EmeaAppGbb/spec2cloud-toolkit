import * as vscode from 'vscode';
import { TemplateService, SpecTemplate } from '../services/templateService';
import { TemplatesViewProvider } from '../providers/templatesViewProvider';

interface MCPToolRequest {
    name: string;
    parameters: {
        searchTerm?: string;
        category?: string;
        industry?: string;
    };
}

export class MCPServer {
    private disposables: vscode.Disposable[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private templateService: TemplateService,
        private templatesProvider: TemplatesViewProvider
    ) {}

    async initialize(): Promise<void> {
        // Register MCP tool handler
        // Note: This is a simplified implementation. In a full MCP implementation,
        // you would use the Model Context Protocol SDK
        this.registerMCPTool();
    }

    private registerMCPTool(): void {
        // Register the spec2cloud-select-template tool
        const disposable = vscode.commands.registerCommand(
            'spec2cloud.mcp.selectTemplate',
            async (request: MCPToolRequest) => {
                return await this.handleSelectTemplate(request);
            }
        );

        this.disposables.push(disposable);
        this.context.subscriptions.push(disposable);
    }

    private async handleSelectTemplate(request: MCPToolRequest): Promise<{
        success: boolean;
        templates?: SpecTemplate[];
        error?: string;
    }> {
        try {
            const { searchTerm = '', category = 'All', industry = 'All' } = request.parameters;

            // Perform search
            const templates = await this.templateService.searchTemplates(
                searchTerm,
                category,
                industry
            );

            // Update the templates view
            this.templatesProvider.setTemplates(templates);

            // Show the Spec2Cloud view
            await vscode.commands.executeCommand('spec2cloud.templates.focus');

            return {
                success: true,
                templates
            };
        } catch (error) {
            return {
                success: false,
                error: String(error)
            };
        }
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
