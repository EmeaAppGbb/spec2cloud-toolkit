import * as vscode from 'vscode';
import { ConfigurationService, ResourceItem } from '../services/configurationService';

export class ResourcesViewProvider implements vscode.TreeDataProvider<ResourceTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ResourceTreeItem | undefined | null | void> = new vscode.EventEmitter<ResourceTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ResourceTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private context: vscode.ExtensionContext,
        private configService: ConfigurationService
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ResourceTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ResourceTreeItem): Promise<ResourceTreeItem[]> {
        if (!element) {
            // Root level - show all resources
            const resources = this.configService.getResources();
            return resources.map(resource => new ResourceTreeItem(resource));
        }

        return [];
    }
}

class ResourceTreeItem extends vscode.TreeItem {
    constructor(public readonly resource: ResourceItem) {
        super(resource.name, vscode.TreeItemCollapsibleState.None);

        this.description = resource.description;
        this.tooltip = `${resource.name}\n${resource.description}\n${resource.url}`;
        
        // Set icon based on the resource's icon property
        this.iconPath = new vscode.ThemeIcon(resource.icon || 'link');
        
        this.command = {
            command: 'spec2cloud.openResource',
            title: 'Open Resource',
            arguments: [resource]
        };

        this.contextValue = 'resource';
    }
}
