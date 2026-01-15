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
            
            let templatesData: Omit<Template, 'repoUrl'>[];
            
            if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
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
                        repo: template.repo,
                        // Extract stars from metadata if available
                        stars: template.metadata?.stars || template.stars
                    };
                });
            } else {
                throw new Error('Invalid templates.json format. Expected array, object with "templates" property, or object with template names as keys.');
            }
            
            // Enrich templates with repo URL
            this.templates = templatesData.map(template => ({
                ...template,
                // Use the repo property from template if available, otherwise generate from templates repo
                repoUrl: (template as any).repo || `${this.templatesRepoUrl}/tree/main/templates/${template.name}`,
                // Track whether this template has its own repo or is part of a collection
                hasOwnRepo: !!(template as any).repo
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

    async initializeTemplate(template: Template, targetDir: vscode.Uri): Promise<void> {
        try {
            this.log(`Starting azd init for template: ${template.name}`);
            this.log(`Repository URL: ${template.repoUrl}`);
            this.log(`Target directory: ${targetDir.fsPath}`);

            // Extract repository info
            const repoInfo = this.extractRepoInfo(template);
            if (!repoInfo) {
                throw new Error('Invalid GitHub repository URL');
            }

            const { owner, repo, branch, basePath } = repoInfo;
            
            // Build the azd init URL
            const initUrl = `https://github.com/${owner}/${repo}.git`;
            
            // Initialize directly into the root directory
            const initTargetPath = targetDir;

            // Check if directory is not empty
            try {
                const entries = await vscode.workspace.fs.readDirectory(initTargetPath);
                if (entries.length > 0) {
                    const overwrite = await vscode.window.showWarningMessage(
                        `Target directory is not empty. Initialize template files into this directory anyway?`,
                        { modal: true },
                        'Yes',
                        'No'
                    );
                    if (overwrite !== 'Yes') {
                        return;
                    }
                }
            } catch {
                // Directory doesn't exist or can't read, which is fine
            }

            // Execute azd init command in terminal
            const terminal = vscode.window.createTerminal({
                name: `Init ${template.name}`,
                cwd: targetDir.fsPath,
                hideFromUser: false
            });

            terminal.show();

            // Build azd init command
            let initCommand: string;
            if (template.hasOwnRepo && !basePath) {
                // Initialize the entire repository into current directory
                this.log(`Initializing template into current workspace directory`);
                initCommand = `azd init --template ${initUrl} --branch ${branch} --environment ${template.name}`;
                terminal.sendText(initCommand);
                vscode.window.showInformationMessage(`Initializing template "${template.title}"... Check terminal for progress.`);
            } 

        } catch (error: any) {
            this.log(`ERROR: Failed to init template: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to init template: ${error.message}`);
            throw error;
        }
    }

    private async getTemplateFiles(template: Template): Promise<{ path: string; templateUrl: string }[]> {
        const repoInfo = this.extractRepoInfo(template);
        if (!repoInfo) {
            throw new Error('Invalid GitHub repository URL in template');
        }

        const { owner, repo, branch, basePath } = repoInfo;
        
        // If template has its own repo, use basePath or root; otherwise use templates/{name}
        let templatePath: string;
        if (template.hasOwnRepo) {
            // Template has its own repository - initialize from basePath or root
            templatePath = basePath || '';
        } else {
            // Template is part of a collection - use templates/{name} path
            templatePath = basePath || `templates/${template.name}`;
        }
        
        this.log(`Fetching template files for ${template.name}`);
        this.log(`Repository: ${owner}/${repo}, Branch: ${branch}`);
        this.log(`Has own repo: ${template.hasOwnRepo}`);
        this.log(`Template path: "${templatePath}"`);
        
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        
        try {
            const response = await axios.get(apiUrl);
            const tree = response.data.tree;

            this.log(`Received ${tree.length} items from repository tree`);

            // Filter files that belong to the template
            const templateFiles = tree
                .filter((item: any) => {
                    const isBlob = item.type === 'blob';
                    
                    // If templatePath is empty, get all files from root
                    let matchesPath: boolean;
                    if (templatePath === '') {
                        matchesPath = true; // All files
                    } else {
                        matchesPath = item.path.startsWith(`${templatePath}/`) || item.path === templatePath;
                    }
                    
                    if (isBlob && matchesPath) {
                        this.log(`Found file: ${item.path}`);
                    }
                    return isBlob && matchesPath;
                })
                .map((item: any) => {
                    // Calculate relative path
                    let relativePath = item.path;
                    
                    if (templatePath !== '') {
                        if (item.path.startsWith(`${templatePath}/`)) {
                            relativePath = item.path.substring(`${templatePath}/`.length);
                        } else if (item.path === templatePath) {
                            // Single file case - extract just the filename
                            relativePath = templatePath.split('/').pop() || templatePath;
                        }
                    }
                    
                    return {
                        path: relativePath,
                        templateUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
                    };
                });

            this.log(`Found ${templateFiles.length} files for template ${template.name}`);
            if (templateFiles.length === 0) {
                this.log(`WARNING: No files found. Check if path "${templatePath}" exists in ${owner}/${repo} on branch ${branch}`);
            }

            return templateFiles;
        } catch (error: any) {
            this.log(`ERROR fetching template files: ${error.message}`);
            if (error.response) {
                this.log(`HTTP Status: ${error.response.status}`);
            }
            throw new Error(`Failed to fetch template files: ${error}`);
        }
    }

    private extractRepoInfo(template: Template): { owner: string; repo: string; branch: string; basePath: string } | null {
        const match = template.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            return null;
        }

        const [, owner, repo] = match;
        
        // Extract branch and base path from URL
        // URL format: https://github.com/owner/repo/tree/branch-name/optional/path
        // Branch names can contain '/' characters (e.g., feature/my-branch)
        const treeMatch = template.repoUrl.match(/\/tree\/(.+)$/);
        let branch = 'main';
        let basePath = '';
        
        if (treeMatch) {
            const afterTree = treeMatch[1];
            // Try to find the branch/path split by looking for common path patterns
            // Strategy: The branch is everything up to and including a known branch pattern,
            // or we use a heuristic to split at likely path boundaries
            
            // Common branch names that might contain slashes
            const commonBranchPrefixes = ['feature/', 'bugfix/', 'hotfix/', 'release/', 'refs/heads/', 'refs/tags/'];
            
            let foundSplit = false;
            
            // First, check if the path starts with a common branch prefix
            for (const prefix of commonBranchPrefixes) {
                if (afterTree.startsWith(prefix)) {
                    // Find the next segment after the prefix as part of the branch name
                    const restAfterPrefix = afterTree.substring(prefix.length);
                    const nextSlashIndex = restAfterPrefix.indexOf('/');
                    if (nextSlashIndex > -1) {
                        branch = prefix + restAfterPrefix.substring(0, nextSlashIndex);
                        basePath = restAfterPrefix.substring(nextSlashIndex + 1);
                    } else {
                        branch = afterTree;
                        basePath = '';
                    }
                    foundSplit = true;
                    break;
                }
            }
            
            if (!foundSplit) {
                // For simple branch names (main, master, develop, or single-segment names),
                // the first segment is the branch
                const segments = afterTree.split('/');
                
                // Check if first segment looks like a common simple branch name
                const simpleBranches = ['main', 'master', 'develop', 'dev', 'staging', 'production', 'prod'];
                if (simpleBranches.includes(segments[0]) || segments.length === 1) {
                    branch = segments[0];
                    basePath = segments.slice(1).join('/');
                } else {
                    // Heuristic: if we can't determine the branch, assume it's just the first segment
                    // This is the fallback for unknown branch naming conventions
                    branch = segments[0];
                    basePath = segments.slice(1).join('/');
                }
            }
        }
        
        return { owner, repo, branch, basePath };
    }

    getThumbnailUrl(template: Template): string {
        // If thumbnail starts with 'resources/', it's a default thumbnail from the extension
        if (template.thumbnail.startsWith('resources/')) {
            this.log(`Using default extension thumbnail for ${template.name}: ${template.thumbnail}`);
            return template.thumbnail; // Will be resolved by the webview
        }
        
        // If thumbnail is already a URL, use it directly
        if (template.thumbnail.startsWith('http://') || template.thumbnail.startsWith('https://')) {
            this.log(`Using direct URL for thumbnail ${template.name}: ${template.thumbnail}`);
            return template.thumbnail;
        }
        
        // Otherwise, build the raw GitHub URL from the template's repo
        const repoInfo = this.extractRepoInfo(template);
        if (repoInfo) {
            const { owner, repo, branch, basePath } = repoInfo;
            
            // Build the URL based on whether template has its own repo
            let path: string;
            if (template.hasOwnRepo) {
                // Template has its own repo - thumbnail is at basePath or root
                path = basePath || '';
            } else {
                // Template is part of a collection
                path = basePath || `templates/${template.name}`;
            }
            
            const url = path 
                ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}/${template.thumbnail}`
                : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${template.thumbnail}`;
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
        
        // If video is already a URL, use it directly (supports YouTube, raw GitHub, etc.)
        if (template.video.startsWith('http://') || template.video.startsWith('https://')) {
            this.log(`Using direct URL for video ${template.name}: ${template.video}`);
            return template.video;
        }
        
        // Otherwise, build the raw GitHub URL from the template's repo
        const repoInfo = this.extractRepoInfo(template);
        if (repoInfo) {
            const { owner, repo, branch, basePath } = repoInfo;
            
            // Build the URL based on whether template has its own repo
            let path: string;
            if (template.hasOwnRepo) {
                // Template has its own repo - video is at basePath or root
                path = basePath || '';
            } else {
                // Template is part of a collection
                path = basePath || `templates/${template.name}`;
            }
            
            const url = path
                ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}/${template.video}`
                : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${template.video}`;
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
