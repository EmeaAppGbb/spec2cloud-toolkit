import * as vscode from 'vscode';
import axios from 'axios';
import { Template, TemplatesConfig } from './types';

export class TemplateService {
    private templates: Template[] = [];
    private templatesRepoUrl: string;
    private outputChannel?: vscode.OutputChannel;

    constructor(outputChannel?: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.templatesRepoUrl = vscode.workspace.getConfiguration('spec2cloud').get('templatesRepo', 'https://github.com/Azure-Samples/Spec2Cloud');
        this.log('TemplateService initialized');
        this.log(`Templates repository: ${this.templatesRepoUrl}`);
    }

    private log(message: string): void {
        if (this.outputChannel) {
            this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
        }
        console.log(`[Spec2Cloud] ${message}`);
    }

    async loadTemplates(): Promise<Template[]> {
        try {
            const rawUrl = this.convertToRawUrl(this.templatesRepoUrl, 'templates.json');
            this.log(`Loading templates from: ${rawUrl}`);
            
            const response = await axios.get(rawUrl);
            this.log(`Received response with status: ${response.status}`);
            this.log(`Response data type: ${Array.isArray(response.data) ? 'array' : typeof response.data}`);
            
            // Handle multiple JSON formats
            let templatesData: Omit<Template, 'repoUrl'>[];
            
            if (Array.isArray(response.data)) {
                // Format 1: Direct array of templates
                templatesData = response.data;
                this.log('Templates data is a direct array');
            } else if (response.data && Array.isArray(response.data.templates)) {
                // Format 2: Object with templates property containing an array
                templatesData = response.data.templates;
                this.log('Templates data is an object with templates property');
            } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                // Format 3: Object where each key is a template name (like the spec2cloud-templates repo)
                this.log('Templates data is an object with template names as keys');
                templatesData = Object.entries(response.data).map(([name, template]: [string, any]) => {
                    // Determine default thumbnail based on category
                    let defaultThumbnail = 'thumbnail.png';
                    if (!template.thumbnail) {
                        switch (template.category) {
                            case 'AI Apps & Agents':
                                defaultThumbnail = 'resources/default-aiapps-thumbnail.png';
                                break;
                            case 'App Modernization':
                                defaultThumbnail = 'resources/default-appmod-thumbnail.png';
                                break;
                            case 'Data Centric Apps':
                                defaultThumbnail = 'resources/default-data-thumbnail.png';
                                break;
                            case 'Agentic DevOps':
                                defaultThumbnail = 'resources/default-devops-thumbnail.png';
                                break;
                            default:
                                defaultThumbnail = 'thumbnail.png';
                        }
                    }
                    
                    return {
                        name,
                        title: template.title || name,
                        description: template.description || '',
                        category: template.category || 'Other',
                        industry: template.industry || 'Cross Industries',
                        thumbnail: template.thumbnail || defaultThumbnail,
                        video: template.video || undefined,
                        services: template.services || [],
                        languages: template.languages || [],
                        frameworks: template.frameworks || [],
                        tags: template.tags || [],
                        // Convert authors from string array to Author objects
                        authors: Array.isArray(template.authors) 
                            ? template.authors.map((author: any) => 
                                typeof author === 'string' 
                                    ? { name: author, githubHandle: author }
                                    : author
                              )
                            : [],
                        version: template.version,
                        lastCommitDate: template['last-commit-date'] || template.lastCommitDate || new Date().toISOString(),
                        // Store the repo URL from template for later use
                        repo: template.repo
                    };
                });
                this.log(`Sample template authors: ${JSON.stringify(templatesData[0]?.authors || 'none')}`);
            } else {
                throw new Error('Invalid templates.json format. Expected array, object with "templates" property, or object with template names as keys.');
            }
            
            // Enrich templates with repo URL
            this.templates = templatesData.map(template => ({
                ...template,
                // Use the repo property from template if available, otherwise generate from templates repo
                repoUrl: (template as any).repo || `${this.templatesRepoUrl}/tree/main/templates/${template.name}`
            }));

            this.log(`Successfully loaded ${this.templates.length} templates`);
            return this.templates;
        } catch (error: any) {
            const errorMessage = error.response?.status === 404 
                ? 'templates.json not found in repository. Please check the repository URL and ensure templates.json exists.'
                : `Failed to load templates: ${error.message || error}`;
            
            this.log(`ERROR: ${errorMessage}`);
            if (error.response) {
                this.log(`HTTP Status: ${error.response.status}`);
                this.log(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            
            vscode.window.showErrorMessage(errorMessage);
            return [];
        }
    }

    getTemplates(): Template[] {
        return this.templates;
    }

    getTemplate(name: string): Template | undefined {
        return this.templates.find(t => t.name === name);
    }

    private convertToRawUrl(repoUrl: string, filePath: string): string {
        // Convert GitHub repo URL to raw content URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            const [, owner, repo] = match;
            return `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
        }
        throw new Error('Invalid GitHub repository URL');
    }

    async downloadTemplate(template: Template, targetDir: vscode.Uri): Promise<void> {
        try {
            const files = await this.getTemplateFiles(template.name);
            
            for (const file of files) {
                const targetPath = vscode.Uri.joinPath(targetDir, file.path);
                
                // Check if file exists
                try {
                    await vscode.workspace.fs.stat(targetPath);
                    continue; // Skip if file exists
                } catch {
                    // File doesn't exist, proceed with download
                }

                // Create directory if needed
                const dirPath = vscode.Uri.joinPath(targetDir, file.path.substring(0, file.path.lastIndexOf('/')));
                await vscode.workspace.fs.createDirectory(dirPath);

                // Download and write file
                const content = await axios.get(file.downloadUrl, { responseType: 'arraybuffer' });
                await vscode.workspace.fs.writeFile(targetPath, new Uint8Array(content.data));
            }

            vscode.window.showInformationMessage(`Template "${template.title}" downloaded successfully!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download template: ${error}`);
            throw error;
        }
    }

    private async getTemplateFiles(templateName: string): Promise<{ path: string; downloadUrl: string }[]> {
        // Use GitHub API to get tree
        const match = this.templatesRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub repository URL');
        }

        const [, owner, repo] = match;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
        
        try {
            const response = await axios.get(apiUrl);
            const tree = response.data.tree;

            // Filter files that belong to the template
            const templateFiles = tree
                .filter((item: any) => item.type === 'blob' && item.path.startsWith(`templates/${templateName}/`))
                .map((item: any) => ({
                    path: item.path.substring(`templates/${templateName}/`.length), // Remove templates/template-name prefix
                    downloadUrl: `https://raw.githubusercontent.com/${owner}/${repo}/main/${item.path}`
                }));

            return templateFiles;
        } catch (error) {
            throw new Error(`Failed to fetch template files: ${error}`);
        }
    }

    getThumbnailUrl(template: Template): string {
        // If thumbnail starts with 'resources/', it's a default thumbnail from the extension
        if (template.thumbnail.startsWith('resources/')) {
            this.log(`Using default extension thumbnail for ${template.name}: ${template.thumbnail}`);
            return template.thumbnail; // Will be resolved by the webview
        }
        
        const match = this.templatesRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            const [, owner, repo] = match;
            const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/templates/${template.name}/${template.thumbnail}`;
            this.log(`Thumbnail URL for ${template.name}: ${url}`);
            return url;
        }
        this.log(`Failed to generate thumbnail URL for ${template.name} - invalid repo URL`);
        return '';
    }

    getVideoUrl(template: Template): string | undefined {
        if (!template.video) {
            this.log(`No video for ${template.name}`);
            return undefined;
        }
        const match = this.templatesRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            const [, owner, repo] = match;
            const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/templates/${template.name}/${template.video}`;
            this.log(`Video URL for ${template.name}: ${url}`);
            return url;
        }
        this.log(`Failed to generate video URL for ${template.name} - invalid repo URL`);
        return undefined;
    }

    async starRepository(repoUrl: string): Promise<void> {
        try {
            // Extract owner and repo from URL
            const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                throw new Error('Invalid GitHub repository URL');
            }
            
            const [, owner, repo] = match;
            
            // Open the stargazers page for the repository
            const stargazersUrl = `https://github.com/${owner}/${repo}/stargazers`;
            vscode.env.openExternal(vscode.Uri.parse(stargazersUrl));
        } catch (error: any) {
            this.log(`Failed to open stargazers page: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to open stargazers page: ${error.message}`);
        }
    }
}
