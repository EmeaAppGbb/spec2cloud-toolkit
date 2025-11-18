import * as vscode from 'vscode';
import { TemplateService } from './templateService';

export class ChatToolsProvider {
    constructor(
        private templateService: TemplateService,
        private extensionUri: vscode.Uri
    ) {}

    registerTools(context: vscode.ExtensionContext): void {
        console.log('[Spec2Cloud] Registering language model tool: spec2cloud_search_templates');
        
        try {
            // Register the language model tool for VS Code Copilot
            const tool: vscode.LanguageModelTool<{ searchTerm?: string; }> = {
                invoke: async (options: vscode.LanguageModelToolInvocationOptions<{ searchTerm?: string; }>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult> => {
                    console.log('[Spec2Cloud] Tool invoked with input:', options.input);
                    const input = options.input;
                    const searchTerm = input.searchTerm || '';
                    
                    return await this.selectTemplate(searchTerm);
                }
            };
            
            const registration = vscode.lm.registerTool('spec2cloud_search_templates', tool);
            context.subscriptions.push(registration);
            console.log('[Spec2Cloud] Language model tool registered successfully');
        } catch (error) {
            console.error('[Spec2Cloud] Failed to register language model tool:', error);
            vscode.window.showErrorMessage(`Failed to register Spec2Cloud tool: ${error}`);
        }


        // Register chat participant
        try {
            const participant = vscode.chat.createChatParticipant('spec2cloud.chat', async (request, chatContext, stream, token) => {
                console.log('[Spec2Cloud] Chat participant invoked with prompt:', request.prompt);
                
                // Get the user's query
                const query = request.prompt;
                
                // Parse the query to extract search criteria
                const searchTerm = query;
                
                // Use the language model with our tool
                const models = await vscode.lm.selectChatModels({ family: 'gpt-5' });
                if (models.length === 0) {
                    stream.markdown('No language model available. Please make sure GitHub Copilot is installed and active.');
                    return;
                }
                
                const model = models[0];
                
                // Get our registered tool
                const tools = vscode.lm.tools;
                const spec2cloudTool = tools.find(t => t.name === 'spec2cloud_search_templates');
                
                if (!spec2cloudTool) {
                    stream.markdown('Spec2Cloud tool not found.');
                    return;
                }
                
                // Create messages for the language model
                const messages = [
                    vscode.LanguageModelChatMessage.User(`Find Spec2Cloud templates matching: ${query}. Use the spec2cloud_search_templates tool.`)
                ];
                
                // Make the request with our tool available
                const chatRequest = await model.sendRequest(messages, {
                    tools: [spec2cloudTool]
                }, token);
                
                // Process the response
                for await (const part of chatRequest.stream) {
                    if (part instanceof vscode.LanguageModelTextPart) {
                        stream.markdown(part.value);
                    } else if (part instanceof vscode.LanguageModelToolCallPart) {
                        // The model wants to call our tool
                        console.log('[Spec2Cloud] Model requesting tool call:', part.name);
                        
                        // Invoke the tool
                        const toolResult = await vscode.lm.invokeTool(part.name, {
                            input: part.input,
                            toolInvocationToken: undefined
                        }, token);
                        
                        // Send the result back to the chat
                        for (const resultPart of toolResult.content) {
                            if (resultPart instanceof vscode.LanguageModelTextPart) {
                                stream.markdown(resultPart.value);
                            }
                        }
                    }
                }
                
                return;
            });
            
            participant.iconPath = vscode.Uri.joinPath(this.extensionUri, 'resources', 'Spec2Cloud-blue.png');
            context.subscriptions.push(participant);
            console.log('[Spec2Cloud] Chat participant registered successfully');
        } catch (error) {
            console.error('[Spec2Cloud] Failed to register chat participant:', error);
        }

        // Also register as a command for backwards compatibility
        context.subscriptions.push(
            vscode.commands.registerCommand('spec2cloud.mcp.searchTemplates', async (args: {
                searchTerm?: string;
            }) => {
                return this.selectTemplate(
                    args.searchTerm || ''
                );
            })
        );
    }

    private async selectTemplate(searchTerm: string): Promise<vscode.LanguageModelToolResult> {
        const templates = this.templateService.getTemplates();
        
        // Filter templates based on criteria
        let filtered = templates.filter(template => {
            
            const searchMatch = !searchTerm || 
                template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
                template.languages.some(l => l.toLowerCase().includes(searchTerm.toLowerCase())) ||
                template.frameworks.some(f => f.toLowerCase().includes(searchTerm.toLowerCase())) ||
                template.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

            return searchMatch;
        });

        // Format the response as markdown for better readability
        let resultText = `Found ${filtered.length} template(s):\n\n`;
        
        filtered.slice(0, 10).forEach(t => {
            resultText += `**${t.title}**\n`;
            resultText += `- Description: ${t.description}\n`;
            resultText += `- Category: ${t.category}\n`;
            resultText += `- Industry: ${t.industry}\n`;
            resultText += `\n----\n[🔎 **View Template**](vscode://ms-gbb-tools.spec2cloud-toolkit?template=${encodeURIComponent(t.name)})\n`;
            resultText += `\n`;
        });
        
        if (filtered.length > 10) {
            resultText += `\n... and ${filtered.length - 10} more templates.`;
        }

        // Return as LanguageModelToolResult
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(resultText)
        ]);
    }
}
