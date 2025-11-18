import * as vscode from 'vscode';
import { TemplateService } from '../templateService';

interface SearchTemplatesInput {
    searchTerm?: string;
    category?: string;
    industry?: string;
}

export class SearchTemplatesTool implements vscode.LanguageModelTool<SearchTemplatesInput> {
    
    constructor(private templateService: TemplateService, private extensionUri: vscode.Uri) {}

    async prepareInvocation(
        _options: vscode.LanguageModelToolInvocationPrepareOptions<SearchTemplatesInput>,
        _token: vscode.CancellationToken
    ) {
        return {
            invocationMessage: 'Searching Spec2Cloud Templates'
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<SearchTemplatesInput>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const input = options.input || {};
            const searchTerm = input.searchTerm || '';
            const category = input.category || 'All';
            const industry = input.industry || 'All';

            // Get templates from the service
            const templates = this.templateService.getTemplates();
            
            // Filter templates based on criteria
            const filtered = templates.filter(template => {
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

            // Format the response
            let resultText = `Found ${filtered.length} template(s):\n\n`;
            
            filtered.slice(0, 10).forEach(t => {
                resultText += `**${t.title}**\n`;
                resultText += `- Description: ${t.description}\n-----\n`;
                resultText += `[🔎 **View Template**](vscode://ms-gbb-tools.spec2cloud-toolkit?template=${encodeURIComponent(t.name)})`;
                resultText += `\n`;
            });
            
            if (filtered.length > 10) {
                resultText += `\n... and ${filtered.length - 10} more templates.`;
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(resultText)
            ]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error searching templates: ${errorMessage}`)
            ]);
        }
    }
}