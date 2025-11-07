import * as vscode from 'vscode';
import { ConfigurationService } from '../services/configurationService';
import { TemplateService } from '../services/templateService';

interface SearchCriteria {
    searchTerm: string;
    category: string;
    industry: string;
}

export class BrowseViewProvider implements vscode.TreeDataProvider<BrowseItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BrowseItem | undefined | null | void> = new vscode.EventEmitter<BrowseItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<BrowseItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private searchCriteria: SearchCriteria = {
        searchTerm: '',
        category: 'All',
        industry: 'All'
    };

    constructor(
        private context: vscode.ExtensionContext,
        private configService: ConfigurationService,
        private templateService: TemplateService
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: BrowseItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: BrowseItem): Promise<BrowseItem[]> {
        if (!element) {
            // Root level - show logo, search box, filters
            return [
                new BrowseItem('Search', vscode.TreeItemCollapsibleState.None, 'search'),
                new BrowseItem('Category', vscode.TreeItemCollapsibleState.None, 'category', this.searchCriteria.category),
                new BrowseItem('Industry', vscode.TreeItemCollapsibleState.None, 'industry', this.searchCriteria.industry)
            ];
        }

        return [];
    }

    async performSearch(): Promise<void> {
        // Get search term
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Enter search term',
            value: this.searchCriteria.searchTerm,
            placeHolder: 'Search templates...'
        });

        if (searchTerm === undefined) {
            return; // User cancelled
        }

        // Get category
        const categories = this.configService.getCategories();
        const category = await vscode.window.showQuickPick(categories, {
            placeHolder: 'Select a category',
            canPickMany: false
        });

        if (category === undefined) {
            return; // User cancelled
        }

        // Get industry
        const industries = this.configService.getIndustries();
        const industry = await vscode.window.showQuickPick(industries, {
            placeHolder: 'Select an industry',
            canPickMany: false
        });

        if (industry === undefined) {
            return; // User cancelled
        }

        // Update search criteria
        this.searchCriteria = {
            searchTerm,
            category,
            industry
        };

        // Perform search
        await this.executeSearch();
    }

    async executeSearch(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Searching templates...',
                cancellable: false
            }, async () => {
                const templates = await this.templateService.searchTemplates(
                    this.searchCriteria.searchTerm,
                    this.searchCriteria.category,
                    this.searchCriteria.industry
                );

                // Update templates view
                await vscode.commands.executeCommand('spec2cloud.updateTemplates', templates);
            });

            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Search failed: ${error}`);
        }
    }

    public getSearchCriteria(): SearchCriteria {
        return this.searchCriteria;
    }
}

class BrowseItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemType: string,
        public readonly value?: string
    ) {
        super(label, collapsibleState);

        if (itemType === 'search') {
            this.iconPath = new vscode.ThemeIcon('search');
            this.description = 'Click search button to begin';
        } else if (itemType === 'category') {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.description = value;
        } else if (itemType === 'industry') {
            this.iconPath = new vscode.ThemeIcon('briefcase');
            this.description = value;
        }

        this.contextValue = itemType;
    }
}
