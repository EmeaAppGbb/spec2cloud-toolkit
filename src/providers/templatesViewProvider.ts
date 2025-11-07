import * as vscode from 'vscode';
import { TemplateService, SpecTemplate } from '../services/templateService';

export class TemplatesViewProvider implements vscode.TreeDataProvider<TemplateItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TemplateItem | undefined | null | void> = new vscode.EventEmitter<TemplateItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TemplateItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private templates: SpecTemplate[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private templateService: TemplateService
    ) {
        // Register command to update templates
        context.subscriptions.push(
            vscode.commands.registerCommand('spec2cloud.updateTemplates', (templates: SpecTemplate[]) => {
                this.setTemplates(templates);
            })
        );
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setTemplates(templates: SpecTemplate[]): void {
        this.templates = templates;
        this.refresh();
    }

    getTreeItem(element: TemplateItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TemplateItem): Promise<TemplateItem[]> {
        if (!element) {
            // Root level - show all templates
            if (this.templates.length === 0) {
                return [new TemplateItem(
                    'No templates',
                    'Wait for the templates to load...',
                    vscode.TreeItemCollapsibleState.None,
                    null
                )];
            }

            return this.templates.map(template => 
                new TemplateItem(
                    template.title,
                    this.getTemplateDescription(template),
                    vscode.TreeItemCollapsibleState.None,
                    template
                )
            );
        }

        return [];
    }

    private getTemplateDescription(template: SpecTemplate): string {
        const lastUpdate = template.lastCommitDate ? ` | ${template.lastCommitDate}` : '';
        return `${template.category} | ${template.industry} | v${template.version}${lastUpdate}`;
    }
}

class TemplateItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly template: SpecTemplate | null
    ) {
        super(label, collapsibleState);

        this.tooltip = this.template ? this.createTooltip() : description;
        this.description = description;

        if (this.template) {
            this.contextValue = 'template';
            this.iconPath = new vscode.ThemeIcon('circle-outline');
        } else {
            this.iconPath = new vscode.ThemeIcon('clock');
        }
    }

    private createTooltip(): vscode.MarkdownString {
        if (!this.template) {
            return new vscode.MarkdownString('');
        }

        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`### ${this.template.title}\n\n`);
        tooltip.appendMarkdown(`${this.template.description}\n\n`);
        tooltip.appendMarkdown(`**Category:** ${this.template.category}\n\n`);
        tooltip.appendMarkdown(`**Industry:** ${this.template.industry}\n\n`);
        tooltip.appendMarkdown(`**Version:** ${this.template.version}\n\n`);
        if (this.template.lastCommitDate) {
            tooltip.appendMarkdown(`**Last Updated:** ${this.template.lastCommitDate}\n\n`);
        }
        tooltip.isTrusted = true;

        return tooltip;
    }
}
