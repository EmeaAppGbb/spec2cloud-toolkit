import * as vscode from 'vscode';

export interface ConfigData {
    categories: string[];
    industries: string[];
    resources: ResourceItem[];
}

export interface ResourceItem {
    name: string;
    description: string;
    url: string;
    icon: string;
}

export class ConfigurationService {
    private configData: ConfigData | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.loadConfiguration();
    }

    private async loadConfiguration(): Promise<void> {
        try {
            const configUri = vscode.Uri.joinPath(this.context.extensionUri, 'config', 'spec2cloud.config.json');
            const configData = await vscode.workspace.fs.readFile(configUri);
            this.configData = JSON.parse(configData.toString());
        } catch (error) {
            // Use default configuration if file doesn't exist
            this.configData = this.getDefaultConfiguration();
        }
    }

    private getDefaultConfiguration(): ConfigData {
        return {
            categories: [
                'All',
                'AI Apps & Agents',
                'App Modernization',
                'Data Centric Apps'
            ],
            industries: [
                'All',
                'Financial Services',
                'Healthcare & Life Sciences',
                'Manufacturing',
                'Retail & Consumer Goods',
                'Government & Public Sector',
                'Education',
                'Energy & Resources',
                'Telco & Media',
                'Mobility & Automotive'
            ],
            resources: [
                {
                    name: 'Spec2Cloud Documentation',
                    description: 'Official documentation and guides',
                    url: 'https://github.com/spec2cloud',
                    icon: 'book'
                },
                {
                    name: 'GitHub Repository',
                    description: 'View source code and contribute',
                    url: 'https://github.com/spec2cloud',
                    icon: 'github'
                }
            ]
        };
    }

    public getCategories(): string[] {
        return this.configData?.categories || this.getDefaultConfiguration().categories;
    }

    public getIndustries(): string[] {
        return this.configData?.industries || this.getDefaultConfiguration().industries;
    }

    public getResources(): ResourceItem[] {
        return this.configData?.resources || this.getDefaultConfiguration().resources;
    }

    public getGitHubRepo(): string {
        return vscode.workspace.getConfiguration('spec2cloud').get('githubRepo') || '';
    }

    public getTemplatesBranch(): string {
        return vscode.workspace.getConfiguration('spec2cloud').get('templatesBranch') || 'main';
    }

    public getTemplatesFolder(): string {
        return vscode.workspace.getConfiguration('spec2cloud').get('templatesFolder') || 'templates';
    }

    public async reload(): Promise<void> {
        await this.loadConfiguration();
    }
}
