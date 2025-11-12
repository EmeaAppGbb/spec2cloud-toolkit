import * as vscode from 'vscode';
import { Resource } from './types';

export class ResourcesTreeProvider implements vscode.TreeDataProvider<ResourceTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ResourceTreeItem | undefined | null | void> = new vscode.EventEmitter<ResourceTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ResourceTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private resources: Resource[] = [];

    constructor(private readonly extensionUri: vscode.Uri) {
        this.loadResources();
    }

    private loadResources(): void {
        const config = vscode.workspace.getConfiguration('spec2cloud');
        this.resources = config.get<Resource[]>('resources', []);
    }

    refresh(): void {
        this.loadResources();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ResourceTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ResourceTreeItem): Thenable<ResourceTreeItem[]> {
        if (!element) {
            return Promise.resolve(
                this.resources.map(resource => new ResourceTreeItem(resource, this.extensionUri))
            );
        }
        return Promise.resolve([]);
    }

    openResource(resource: Resource): void {
        vscode.env.openExternal(vscode.Uri.parse(resource.url));
    }
}

class ResourceTreeItem extends vscode.TreeItem {
    constructor(
        public readonly resource: Resource,
        private readonly extensionUri: vscode.Uri
    ) {
        super(resource.name, vscode.TreeItemCollapsibleState.None);

        this.tooltip = resource.description;
        this.description = resource.description;
        this.contextValue = 'resource';

        // Set icon from resources/services folder
        const iconFileName = resource.icon.toLowerCase().replace(/\s+/g, '-');
        this.iconPath = vscode.Uri.joinPath(this.extensionUri, 'resources', 'services', `${iconFileName}.svg`);

        // Make it clickable
        this.command = {
            command: 'spec2cloud.openResource',
            title: 'Open Resource',
            arguments: [resource]
        };
    }
}
