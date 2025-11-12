import * as vscode from 'vscode';
import * as path from 'path';

export class GalleryViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'spec2cloud.gallery';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly openGalleryCommand: () => void
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'resources')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'openGallery':
                    this.openGalleryCommand();
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const imageUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'resources', 'Spec2Cloud-gallery.png')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spec2Cloud Gallery</title>
    <style>
        body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            font-family: var(--vscode-font-family);
        }
        img {
            width: 100%;
            max-width: 400px;
            height: auto;
            border-radius: 8px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-weight: 500;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button:active {
            background-color: var(--vscode-button-activeBackground);
        }
    </style>
</head>
<body>
    <img src="${imageUri}" alt="Spec2Cloud Gallery">
    <button id="openGalleryBtn">Open Template Gallery</button>

    <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('openGalleryBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'openGallery' });
        });
    </script>
</body>
</html>`;
    }
}
