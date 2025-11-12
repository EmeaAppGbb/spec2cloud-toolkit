import * as vscode from 'vscode';
import { Template, SortOrder } from './types';
import { TemplateService } from './templateService';

export class TemplatesTreeProvider implements vscode.TreeDataProvider<TemplateTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TemplateTreeItem | undefined | null | void> = new vscode.EventEmitter<TemplateTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TemplateTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private sortOrder: SortOrder = SortOrder.dateNewest;
    private templates: Template[] = [];

    constructor(private templateService: TemplateService) {}

    refresh(): void {
        this.templates = this.templateService.getTemplates();
        this.sortTemplates();
        this._onDidChangeTreeData.fire();
    }

    setSortOrder(order: SortOrder): void {
        this.sortOrder = order;
        this.sortTemplates();
        this._onDidChangeTreeData.fire();
    }

    private sortTemplates(): void {
        switch (this.sortOrder) {
            case SortOrder.nameAsc:
                this.templates.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case SortOrder.nameDesc:
                this.templates.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case SortOrder.dateNewest:
                this.templates.sort((a, b) => new Date(b.lastCommitDate).getTime() - new Date(a.lastCommitDate).getTime());
                break;
            case SortOrder.dateOldest:
                this.templates.sort((a, b) => new Date(a.lastCommitDate).getTime() - new Date(b.lastCommitDate).getTime());
                break;
        }
    }

    getTreeItem(element: TemplateTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TemplateTreeItem): Thenable<TemplateTreeItem[]> {
        if (!element) {
            return Promise.resolve(
                this.templates.map(template => new TemplateTreeItem(template))
            );
        }
        return Promise.resolve([]);
    }
}

class TemplateTreeItem extends vscode.TreeItem {
    constructor(public readonly template: Template) {
        super(template.title, vscode.TreeItemCollapsibleState.None);

        this.tooltip = `${template.title}\n${template.description}\nCategory: ${template.category}\nIndustry: ${template.industry}`;
        this.description = this.getRelativeDate(template.lastCommitDate);
        this.contextValue = 'template';

        // Set icon based on category
        this.iconPath = new vscode.ThemeIcon('file-code');
    }

    private getRelativeDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else if (diffDays === 1) {
            return 'yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffWeeks < 4) {
            return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
        } else if (diffMonths < 12) {
            return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
        } else {
            return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
        }
    }
}
