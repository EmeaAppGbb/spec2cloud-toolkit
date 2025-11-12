import * as vscode from 'vscode';
import { TemplateService } from './templateService';
import { TemplateGalleryPanel } from './templateGalleryPanel';

export class McpToolsProvider {
    constructor(
        private templateService: TemplateService,
        private extensionUri: vscode.Uri
    ) {}

    registerTools(context: vscode.ExtensionContext): void {
        // Register the spec2cloud-select-template MCP tool
        context.subscriptions.push(
            vscode.commands.registerCommand('spec2cloud.mcp.selectTemplate', async (args: {
                searchTerm?: string;
                category?: string;
                industry?: string;
            }) => {
                return this.selectTemplate(
                    args.searchTerm || '',
                    args.category || 'All',
                    args.industry || 'All'
                );
            })
        );
    }

    private async selectTemplate(searchTerm: string, category: string, industry: string): Promise<any> {
        const templates = this.templateService.getTemplates();
        
        // Filter templates based on criteria
        let filtered = templates.filter(template => {
            const categoryMatch = category === 'All' || template.category === category;
            const industryMatch = industry === 'All' || template.industry === industry;
            
            const searchMatch = !searchTerm || 
                template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
                template.languages.some(l => l.toLowerCase().includes(searchTerm.toLowerCase())) ||
                template.frameworks.some(f => f.toLowerCase().includes(searchTerm.toLowerCase())) ||
                template.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

            return categoryMatch && industryMatch && searchMatch;
        });

        // Open the gallery with the search term
        TemplateGalleryPanel.createOrShow(this.extensionUri, this.templateService, searchTerm);

        // Return the filtered templates
        return {
            success: true,
            count: filtered.length,
            templates: filtered.map(t => ({
                name: t.name,
                title: t.title,
                description: t.description,
                category: t.category,
                industry: t.industry,
                version: t.version,
                lastCommitDate: t.lastCommitDate
            }))
        };
    }
}
