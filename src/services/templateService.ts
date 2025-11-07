import * as vscode from 'vscode';
import axios from 'axios';
import * as path from 'path';
import { ConfigurationService } from './configurationService';

export interface SpecTemplate {
    id: string;
    name: string;
    title: string;
    description: string;
    thumbnail: string;
    version: string;
    category: string;
    industry: string;
    folderPath: string;
    repoUrl: string;
    rawUrl: string;
    lastCommitDate?: string;
}

export class TemplateService {
    private templates: SpecTemplate[] = [];
    private templatesCache: Map<string, SpecTemplate[]> = new Map();
    private githubToken: string | undefined;

    constructor(private configService: ConfigurationService) {}

    private async getGitHubToken(promptUser: boolean = false): Promise<string | undefined> {
        if (this.githubToken) {
            return this.githubToken;
        }

        try {
            // Try to get existing session first
            let session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: false });
            
            // If no session and we should prompt, ask user to sign in
            if (!session && promptUser) {
                session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
            }
            
            if (session) {
                this.githubToken = session.accessToken;
                console.log('[Spec2Cloud] Using authenticated GitHub session');
                return this.githubToken;
            }
        } catch (error) {
            console.warn('[Spec2Cloud] Could not get GitHub authentication:', error);
        }

        return undefined;
    }

    private async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.getGitHubToken();
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    public async fetchTemplates(): Promise<SpecTemplate[]> {
        const repoUrl = this.configService.getGitHubRepo();
        
        if (!repoUrl) {
            vscode.window.showWarningMessage('Please configure the GitHub repository URL in settings.');
            return [];
        }

        const cacheKey = repoUrl;
        if (this.templatesCache.has(cacheKey)) {
            return this.templatesCache.get(cacheKey)!;
        }

        try {
            const templates = await this.discoverTemplates(repoUrl);
            this.templatesCache.set(cacheKey, templates);
            this.templates = templates;
            return templates;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch templates: ${error}`);
            return [];
        }
    }

    private async discoverTemplates(repoUrl: string): Promise<SpecTemplate[]> {
        const templates: SpecTemplate[] = [];
        const branch = this.configService.getTemplatesBranch();
        const templatesFolder = this.configService.getTemplatesFolder();

        // Parse GitHub URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub repository URL');
        }

        const [, owner, repo] = match;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${templatesFolder}?ref=${branch}`;

        console.log(`[Spec2Cloud] Fetching templates from: ${apiUrl}`);

        try {
            const headers = await this.getAuthHeaders();
            const response = await axios.get(apiUrl, { headers });

            const folders = response.data.filter((item: any) => item.type === 'dir');
            console.log(`[Spec2Cloud] Found ${folders.length} template folders`);

            for (const folder of folders) {
                try {
                    console.log(`[Spec2Cloud] Parsing template: ${folder.name}`);
                    const template = await this.parseTemplate(owner, repo, branch, templatesFolder, folder.name);
                    if (template) {
                        templates.push(template);
                        console.log(`[Spec2Cloud] Successfully parsed: ${template.title}`);
                    }
                } catch (error) {
                    console.error(`[Spec2Cloud] Failed to parse template ${folder.name}:`, error);
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    const errorMsg = `Templates folder not found: ${templatesFolder}`;
                    console.error(`[Spec2Cloud] ${errorMsg}`);
                    throw new Error(errorMsg);
                } else if (error.response?.status === 403) {
                    const errorMsg = 'GitHub API rate limit exceeded. Please wait a few minutes or configure a GitHub personal access token in settings.';
                    console.error(`[Spec2Cloud] ${errorMsg}`);
                    vscode.window.showErrorMessage(`Spec2Cloud: ${errorMsg}`);
                    throw new Error(errorMsg);
                }
            }
            console.error(`[Spec2Cloud] Error fetching templates:`, error);
            throw error;
        }

        console.log(`[Spec2Cloud] Total templates loaded: ${templates.length}`);
        return templates;
    }

    private async parseTemplate(
        owner: string,
        repo: string,
        branch: string,
        templatesFolder: string,
        templateName: string
    ): Promise<SpecTemplate | null> {
        // Try multiple README file name variations
        const readmeVariations = ['README.md', 'readme.md', 'Readme.md', 'README.MD'];
        
        for (const readmeFile of readmeVariations) {
            const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${templatesFolder}/${templateName}/${readmeFile}`;
            
            try {
                const response = await axios.get(readmeUrl);
                const content = response.data;

                // Parse frontmatter
                const metadata = this.parseFrontmatter(content);
                const { title, description } = this.parseMarkdown(content);

                // Fetch last commit date for the template folder
                const lastCommitDate = await this.getLastCommitDate(owner, repo, branch, `${templatesFolder}/${templateName}`);

                // Clean category and industry by removing everything after #
                const cleanCategory = (metadata.category || 'Uncategorized').split('#')[0].trim();
                const cleanIndustry = (metadata.industry || 'General').split('#')[0].trim();

                const template: SpecTemplate = {
                    id: templateName,
                    name: templateName,
                    title: metadata.title || title || templateName,
                    description: metadata.description || description || 'No description available',
                    thumbnail: metadata.thumbnail || 'thumbnail.png',
                    version: metadata.version || '1.0.0',
                    category: cleanCategory,
                    industry: cleanIndustry,
                    folderPath: `${templatesFolder}/${templateName}`,
                    repoUrl: `https://github.com/${owner}/${repo}`,
                    rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`,
                    lastCommitDate
                };

                console.log(`[Spec2Cloud] Found README for '${templateName}': ${readmeFile}`);
                return template;
            } catch (error) {
                // Continue to next variation
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    continue;
                }
                // If it's not a 404, log the error but continue trying
                console.warn(`[Spec2Cloud] Error trying ${readmeFile} for ${templateName}:`, error instanceof Error ? error.message : error);
            }
        }
        
        // No README file found with any variation
        console.warn(`[Spec2Cloud] Template '${templateName}' skipped: No README file found (tried: ${readmeVariations.join(', ')})`);
        return null;
    }

    private async getLastCommitDate(owner: string, repo: string, branch: string, folderPath: string): Promise<string | undefined> {
        try {
            // Use GitHub API to get commits for the specific folder path
            const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${folderPath}&sha=${branch}&per_page=1`;
            const headers = await this.getAuthHeaders();
            const response = await axios.get(commitsUrl, { headers });

            if (response.data && response.data.length > 0) {
                const lastCommit = response.data[0];
                const commitDate = lastCommit.commit.author.date;
                
                // Format the date nicely
                const date = new Date(commitDate);
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
        } catch (error) {
            console.warn(`[Spec2Cloud] Could not fetch last commit date for ${folderPath}:`, error instanceof Error ? error.message : error);
        }
        return undefined;
    }

    private parseFrontmatter(content: string): any {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return {};
        }

        const frontmatter = match[1];
        const metadata: any = {};

        const lines = frontmatter.split('\n');
        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();
                metadata[key.trim()] = value;
            }
        }

        return metadata;
    }

    private parseMarkdown(content: string): { title: string; description: string } {
        // Remove frontmatter
        const contentWithoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
        
        // Extract title (first # heading)
        const titleMatch = contentWithoutFrontmatter.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Extract description (first paragraph after title)
        const descMatch = contentWithoutFrontmatter.match(/^#\s+.+$\s*\n\s*\n(.+)/m);
        const description = descMatch ? descMatch[1].trim() : '';

        return { title, description };
    }

    public async searchTemplates(
        searchTerm: string,
        category: string = 'All',
        industry: string = 'All'
    ): Promise<SpecTemplate[]> {
        const allTemplates = await this.fetchTemplates();
        
        console.log(`[Spec2Cloud] Searching templates:`, {
            totalTemplates: allTemplates.length,
            searchTerm,
            category,
            industry
        });

        if (allTemplates.length === 0) {
            console.log('[Spec2Cloud] No templates found. Check repository configuration.');
            return [];
        }
        
        const results = allTemplates.filter(template => {
            // Search in title, description, and template name
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                template.title.toLowerCase().includes(searchLower) ||
                template.description.toLowerCase().includes(searchLower) ||
                template.name.toLowerCase().includes(searchLower);

            const matchesCategory = category === 'All' || 
                template.category.toLowerCase() === category.toLowerCase();
            
            const matchesIndustry = industry === 'All' || 
                template.industry.toLowerCase() === industry.toLowerCase();

            const matches = matchesSearch && matchesCategory && matchesIndustry;

            if (searchTerm && matches) {
                console.log(`[Spec2Cloud] Match found: ${template.title}`);
            }

            return matches;
        });

        console.log(`[Spec2Cloud] Search results: ${results.length} templates found`);
        return results;
    }

    public async viewTemplate(template: SpecTemplate): Promise<void> {
        try {
            // Try different README file name variations
            const readmeVariations = ['README.md', 'readme.md', 'Readme.md', 'README.MD'];
            let readmeContent: string | null = null;
            let readmeUrl: string | null = null;

            for (const readmeFile of readmeVariations) {
                const url = `${template.rawUrl}/${template.folderPath}/${readmeFile}`;
                try {
                    const response = await axios.get(url);
                    readmeContent = response.data;
                    readmeUrl = url;
                    break;
                } catch (error) {
                    // Continue to next variation
                    if (axios.isAxiosError(error) && error.response?.status === 404) {
                        continue;
                    }
                }
            }

            if (!readmeContent || !readmeUrl) {
                vscode.window.showErrorMessage('README.md not found for this template.');
                return;
            }

            // Create a temporary file to display the README
            const tempFileName = `${template.name}-README.md`;
            const doc = await vscode.workspace.openTextDocument({
                content: readmeContent,
                language: 'markdown'
            });

            // Open in preview mode
            await vscode.commands.executeCommand('markdown.showPreview', doc.uri);
        } catch (error) {
            console.error('[Spec2Cloud] Error viewing template:', error);
            vscode.window.showErrorMessage(`Failed to view template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async viewTemplateOnGitHub(template: SpecTemplate): Promise<void> {
        const url = `${template.repoUrl}/tree/${this.configService.getTemplatesBranch()}/${template.folderPath}`;
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }

    public async useTemplate(template: SpecTemplate): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('Please open a workspace folder first.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const specsFolder = path.join(workspaceRoot, 'specs');

        // Check if specs folder already exists
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(specsFolder));
            vscode.window.showWarningMessage('The folder "specs" already exists in your workspace. Please remove it first or choose a different location.');
            return;
        } catch {
            // Folder doesn't exist, proceed with download
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Copying template: ${template.title}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Download template folder into specs folder, maintaining internal structure
                await this.downloadFolderToTarget(template, workspaceRoot, template.folderPath, 'specs', progress);

                // Download .github folder to workspace root only if it doesn't exist
                const githubFolderPath = path.join(workspaceRoot, '.github');
                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(githubFolderPath));
                    console.log('.github folder already exists in workspace root, skipping');
                } catch {
                    // .github folder doesn't exist, try to download it
                    try {
                        await this.downloadFolder(template, workspaceRoot, '.github', progress);
                        console.log('.github folder downloaded to workspace root');
                    } catch (error) {
                        // .github folder might not exist in template, that's okay
                        console.log('.github folder not found in template, skipping');
                    }
                }

                progress.report({ increment: 100 });
            });

            vscode.window.showInformationMessage(`Template "${template.title}" has been added to your workspace in the "specs" folder!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy template: ${error}`);
        }
    }

    private async downloadFolder(
        template: SpecTemplate,
        workspaceRoot: string,
        folderPath: string,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        const match = template.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid repository URL');
        }

        const [, owner, repo] = match;
        const branch = this.configService.getTemplatesBranch();
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;

        const headers = await this.getAuthHeaders();
        const response = await axios.get(apiUrl, { headers });

        for (const item of response.data) {
            const relativePath = item.path.replace(`${this.configService.getTemplatesFolder()}/`, '');
            const localPath = path.join(workspaceRoot, relativePath);

            if (item.type === 'file') {
                // Check if file already exists
                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(localPath));
                    console.log(`Skipping existing file: ${localPath}`);
                    continue;
                } catch {
                    // File doesn't exist, proceed to download
                }

                progress.report({ message: `Downloading ${item.name}...` });

                const fileResponse = await axios.get(item.download_url, {
                    responseType: 'arraybuffer'
                });

                const fileUri = vscode.Uri.file(localPath);
                await vscode.workspace.fs.writeFile(fileUri, new Uint8Array(fileResponse.data));
            } else if (item.type === 'dir') {
                // Recursively download directory
                await this.downloadFolder(template, workspaceRoot, item.path, progress);
            }
        }
    }

    private async downloadFolderToTarget(
        template: SpecTemplate,
        targetRoot: string,
        folderPath: string,
        targetFolderName: string,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        const match = template.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid repository URL');
        }

        const [, owner, repo] = match;
        const branch = this.configService.getTemplatesBranch();
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;

        const headers = await this.getAuthHeaders();
        const response = await axios.get(apiUrl, { headers });

        for (const item of response.data) {
            // Replace the templates folder with the target folder name, maintaining structure
            const templatesFolder = this.configService.getTemplatesFolder();
            let relativePath = item.path;
            
            // Replace the templates folder name with 'specs'
            if (relativePath.startsWith(templatesFolder + '/')) {
                relativePath = relativePath.replace(templatesFolder, targetFolderName);
            } else if (relativePath.startsWith('.github')) {
                // Keep .github structure under specs
                relativePath = path.join(targetFolderName, relativePath);
            }
            
            const localPath = path.join(targetRoot, relativePath);

            if (item.type === 'file') {
                progress.report({ message: `Downloading ${item.name}...` });

                const fileResponse = await axios.get(item.download_url, {
                    responseType: 'arraybuffer'
                });

                const fileUri = vscode.Uri.file(localPath);
                await vscode.workspace.fs.writeFile(fileUri, new Uint8Array(fileResponse.data));
            } else if (item.type === 'dir') {
                // Recursively download directory
                await this.downloadFolderToTarget(template, targetRoot, item.path, targetFolderName, progress);
            }
        }
    }

    public getThumbnailUri(template: SpecTemplate, context: vscode.ExtensionContext): vscode.Uri {
        // Try to use the template's thumbnail
        if (template.thumbnail && template.thumbnail !== 'thumbnail.png') {
            const thumbnailUrl = `${template.rawUrl}/${template.folderPath}/${template.thumbnail}`;
            return vscode.Uri.parse(thumbnailUrl);
        }

        // Check if default thumbnail exists
        const thumbnailUrl = `${template.rawUrl}/${template.folderPath}/thumbnail.png`;
        // For now, we'll assume it exists. In production, you'd want to check this.
        
        // Fallback to extension's default thumbnail
        return vscode.Uri.joinPath(context.extensionUri, 'resources', 'default-thumbnail.png');
    }

    public clearCache(): void {
        this.templatesCache.clear();
        this.templates = [];
    }
}
