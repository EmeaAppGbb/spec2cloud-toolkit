import * as vscode from 'vscode';
import { Template } from './types';
import { TemplateService } from './templateService';

export class TemplateGalleryPanel {
    public static currentPanel: TemplateGalleryPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private templateService: TemplateService,
        private searchTerm?: string
    ) {
        this._panel = panel;

        // Set the webview's initial html content
        this._update(extensionUri);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openExternal':
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        break;
                    case 'useTemplate':
                        this.handleUseTemplate(message.templateName);
                        break;
                    case 'starRepo':
                        vscode.env.openExternal(vscode.Uri.parse(message.repoUrl));
                        break;
                    case 'showError':
                        vscode.window.showErrorMessage(message.message);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, templateService: TemplateService, searchTerm?: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (TemplateGalleryPanel.currentPanel) {
            TemplateGalleryPanel.currentPanel._panel.reveal(column);
            TemplateGalleryPanel.currentPanel.updateSearch(searchTerm);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'spec2cloudGallery',
            '🚀 Spec Templates Gallery',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'resources')
                ],
                retainContextWhenHidden: true
            }
        );

        TemplateGalleryPanel.currentPanel = new TemplateGalleryPanel(panel, extensionUri, templateService, searchTerm);
    }

    public updateSearch(searchTerm?: string) {
        if (searchTerm) {
            this._panel.webview.postMessage({ command: 'updateSearch', searchTerm });
        }
    }

    private async handleUseTemplate(templateName: string) {
        const template = this.templateService.getTemplate(templateName);
        if (!template) {
            vscode.window.showErrorMessage('Template not found');
            return;
        }

        const answer = await vscode.window.showInformationMessage(
            `This action will clone the template into the current workspace. Continue?`,
            { modal: true },
            'Yes'
        );

        if (answer === 'Yes') {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder is open');
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Cloning template: ${template.title}`,
                cancellable: false
            }, async () => {
                await this.templateService.downloadTemplate(template, workspaceFolders[0].uri);
            });
        }
    }

    public dispose() {
        TemplateGalleryPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(extensionUri: vscode.Uri) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, extensionUri);
    }

    private _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const templates = this.templateService.getTemplates();
        const templatesJson = JSON.stringify(templates.map(t => {
            let thumbnailUrl = this.templateService.getThumbnailUrl(t);
            
            // If thumbnail starts with 'resources/', convert it to webview URI
            if (thumbnailUrl.startsWith('resources/')) {
                const fileName = thumbnailUrl.substring('resources/'.length);
                thumbnailUrl = webview.asWebviewUri(
                    vscode.Uri.joinPath(extensionUri, 'resources', fileName)
                ).toString();
            }
            
            return {
                ...t,
                thumbnailUrl,
                videoUrl: this.templateService.getVideoUrl(t)
            };
        }));

        // Get URIs for resources
        const getResourceUri = (folder: string, file: string) => {
            return webview.asWebviewUri(
                vscode.Uri.joinPath(extensionUri, 'resources', folder, file)
            ).toString();
        };

        // Get all service icons
        const serviceIcons = [
            'azure-ai-bot-service', 'azure-ai-content-safety', 'azure-ai-document-intelligence',
            'azure-ai-face-service', 'azure-ai-foundry', 'azure-ai-language', 'azure-ai-search',
            'azure-ai-speech', 'azure-ai-translator', 'azure-ai-vision', 'azure-api-center',
            'azure-api-management', 'azure-app-configuration', 'azure-app-service',
            'azure-application-gateway', 'azure-communication-services', 'azure-container-apps',
            'azure-container-registry', 'azure-container-storage', 'azure-cosmos-db',
            'azure-data-factory', 'azure-data-lake-storage', 'azure-database-for-mysql',
            'azure-database-for-postgresql', 'azure-databricks', 'azure-deployment-environments',
            'azure-event-grid', 'azure-event-hubs', 'azure-frontdoor', 'azure-functions',
            'azure-key-vault', 'azure-kubernetes-service', 'azure-logic-apps',
            'azure-machine-learning', 'azure-managed-grafana', 'azure-managed-redis',
            'azure-migrate', 'azure-monitor', 'azure-notification-hubs', 'azure-openai',
            'azure-policy', 'azure-private-link', 'azure-red-hat-openshift', 'azure-service-bus',
            'azure-signalr-service', 'azure-sql-database', 'azure-sre-agent', 'azure-storage',
            'azure-stream-analytics', 'azure-traffic-manager', 'azure-virtual-machines',
            'azure-virtual-network', 'azure-web-pubsub', 'Azure', 'github',
            'microsoft-copilot', 'microsoft-dragon-copilot', 'microsoft-entra-id',
            'microsoft-fabric', 'microsoft-playwright-testing', 'microsoft-power-bi-embedded',
            'microsoft-purview', 'vs-code'
        ];

        const languageIcons = ['dotnet', 'go', 'java', 'python', 'typescript'];
        const frameworkIcons = ['aspire', 'langchain', 'microsoft-agent-framework', 'pydantic-ai'];

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; media-src https:; script-src 'unsafe-inline' ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource};">
    <title>Spec Templates Gallery</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
        }

        .header {
            margin-bottom: 30px;
        }

        h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 20px;
        }

        .controls {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            align-items: center;
        }

        .search-box {
            flex: 1;
            min-width: 300px;
        }

        .search-box input {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 2px solid var(--vscode-focusBorder);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: 14px;
        }

        .search-box input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .sort-control {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .sort-control select {
            padding: 8px 12px;
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: 14px;
        }

        .filters-toggle-btn {
            padding: 8px 12px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.2s;
        }

        .filters-toggle-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .filters-toggle-btn:active {
            background-color: var(--vscode-button-background);
        }

        .main-content {
            display: flex;
            gap: 20px;
        }

        .gallery-container {
            flex: 1;
        }

        .filters-panel {
            width: 280px;
            background-color: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
            transition: all 0.3s ease;
            display: block;
        }

        .filters-panel.collapsed {
            width: 0;
            padding: 0;
            border: none;
            overflow: hidden;
            display: none;
        }

        .filter-section {
            margin-bottom: 20px;
        }

        .filter-section h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .filter-section select {
            width: 100%;
            padding: 6px 8px;
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: 13px;
        }

        .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .checkbox-item input[type="checkbox"] {
            cursor: pointer;
        }

        .checkbox-item label {
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .icon-small {
            width: 16px;
            height: 16px;
        }

        #servicesFilter .checkbox-item label img {
            filter: brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(3000%) hue-rotate(200deg) brightness(100%) contrast(90%);
        }

        #languagesFilter .checkbox-item label img {
            filter: brightness(0) saturate(100%) invert(55%) sepia(98%) saturate(3000%) hue-rotate(10deg) brightness(100%) contrast(90%);
        }

        #frameworksFilter .checkbox-item label img {
            filter: brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(3000%) hue-rotate(260deg) brightness(100%) contrast(90%);
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }

        .template-card {
            background-color: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .template-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .thumbnail-container {
            position: relative;
            width: 100%;
            padding-top: 56.25%; /* 16:9 aspect ratio */
            background-color: var(--vscode-editor-background);
            overflow: hidden;
        }

        .thumbnail-container img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .thumbnail-container:hover .play-button {
            opacity: 1;
        }

        .card-content {
            padding: 16px;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            cursor: pointer;
            color: var(--vscode-textLink-foreground);
        }

        .card-title:hover {
            text-decoration: underline;
        }

        .card-description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
            line-height: 1.4;
        }

        .card-authors {
            font-size: 12px;
            margin-bottom: 8px;
        }

        .author-link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
        }

        .author-link:hover {
            text-decoration: underline;
        }

        .card-meta {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }

        .badge {
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
        }

        .badge-category {
            background-color: #e3f2fd;
            color: #1565c0;
        }

        .badge-industry {
            background-color: #f3e5f5;
            color: #6a1b9a;
        }

        .badge-version {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .badge-section {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }

        .badge-service {
            background-color: #3b82f6;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .badge-language {
            background-color: #f97316;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .badge-language img {
            filter: brightness(0) invert(1);
        }

        .badge-framework {
            background-color: #a855f7;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .badge-framework img {
            filter: brightness(0) invert(1);
        }

        .badge-tag {
            background-color: #22c55e;
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
        }

        .card-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 12px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .action-buttons {
            display: flex;
            gap: 8px;
        }

        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: var(--vscode-font-family);
        }

        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .icon-btn {
            width: 16px;
            height: 16px;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background-color: var(--vscode-editor-background);
            padding: 20px;
            border-radius: 8px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
            position: relative;
        }

        .modal-close {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 28px;
            font-weight: bold;
            color: var(--vscode-foreground);
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-close:hover {
            opacity: 0.7;
        }

        .modal-details {
            margin-top: 20px;
        }

        .modal-details h2 {
            margin-bottom: 16px;
        }

        .detail-row {
            margin-bottom: 12px;
        }

        .detail-label {
            font-weight: 600;
            margin-bottom: 4px;
        }

        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
            font-size: 16px;
        }

        video {
            width: 100%;
            max-width: 800px;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Browse for Spec Templates</h1>
        <div class="controls">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search templates..." value="${this.searchTerm || ''}">
            </div>
            <div class="sort-control">
                <select id="sortSelect">
                    <option value="date-newest">Newest First</option>
                    <option value="date-oldest">Oldest First</option>
                    <option value="name-asc">Title (A-Z)</option>
                    <option value="name-desc">Title (Z-A)</option>
                </select>
                <button class="filters-toggle-btn" onclick="toggleFilters()" id="filtersToggleBtn">
                    <span>☰</span>
                    <span>Filters</span>
                </button>
            </div>
        </div>
    </div>

    <div class="main-content">
        <div class="gallery-container">
            <div class="gallery-grid" id="galleryGrid"></div>
            <div class="no-results" id="noResults" style="display: none;">
                No templates found matching your criteria.
            </div>
        </div>

        <div class="filters-panel collapsed" id="filtersPanel">
            <div class="filter-section">
                <h3>Category</h3>
                <select id="categoryFilter">
                    <option value="">All</option>
                </select>
            </div>

            <div class="filter-section">
                <h3>Industry</h3>
                <select id="industryFilter">
                    <option value="">All</option>
                </select>
            </div>

            <div class="filter-section">
                <h3>Services</h3>
                <div class="checkbox-group" id="servicesFilter"></div>
            </div>

            <div class="filter-section">
                <h3>Languages</h3>
                <div class="checkbox-group" id="languagesFilter"></div>
            </div>

            <div class="filter-section">
                <h3>Frameworks</h3>
                <div class="checkbox-group" id="frameworksFilter"></div>
            </div>
        </div>
    </div>

    <div id="videoModal" class="modal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeVideoModal()">&times;</button>
            <video id="modalVideo" controls autoplay loop muted style="display: none;"></video>
        </div>
    </div>

    <div id="detailsModal" class="modal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
            <div class="modal-details" id="modalDetails"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const templates = ${templatesJson};

        // Icon mappings
        const iconMap = {
            ${serviceIcons.map(icon => `'${icon}': '${getResourceUri('services', icon + '.svg')}'`).join(',\n            ')},
            ${languageIcons.map(icon => `'${icon}': '${getResourceUri('languages', icon + '.svg')}'`).join(',\n            ')},
            ${frameworkIcons.map(icon => `'${icon}': '${getResourceUri('frameworks', icon + '.svg')}'`).join(',\n            ')}
        };

        const githubIcon = '${getResourceUri('services', 'github.svg')}';

        let filteredTemplates = [...templates];
        let currentSort = 'date-newest';

        // Toggle filters panel
        function toggleFilters() {
            const filtersPanel = document.getElementById('filtersPanel');
            filtersPanel.classList.toggle('collapsed');
        }

        // Initialize filters
        function initializeFilters() {
            const categories = [...new Set(templates.map(t => t.category))].sort();
            const industries = [...new Set(templates.map(t => t.industry))].sort();
            const services = [...new Set(templates.flatMap(t => t.services))].sort();
            const languages = [...new Set(templates.flatMap(t => t.languages))].sort();
            const frameworks = [...new Set(templates.flatMap(t => t.frameworks))].sort();

            const categoryFilter = document.getElementById('categoryFilter');
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoryFilter.appendChild(option);
            });

            const industryFilter = document.getElementById('industryFilter');
            industries.forEach(ind => {
                const option = document.createElement('option');
                option.value = ind;
                option.textContent = ind;
                industryFilter.appendChild(option);
            });

            const servicesFilter = document.getElementById('servicesFilter');
            services.forEach(service => {
                const div = document.createElement('div');
                div.className = 'checkbox-item';
                const normalizedService = service.toLowerCase().replace(/\\s+/g, '-');
                div.innerHTML = \`
                    <input type="checkbox" id="service-\${service}" value="\${service}">
                    <label for="service-\${service}">
                        <img src="\${iconMap[normalizedService] || ''}" class="icon-small" onerror="this.style.display='none'">
                        \${service}
                    </label>
                \`;
                servicesFilter.appendChild(div);
            });

            const languagesFilter = document.getElementById('languagesFilter');
            languages.forEach(lang => {
                const div = document.createElement('div');
                div.className = 'checkbox-item';
                // Special case for .NET to map to dotnet icon
                let normalizedLang = lang.toLowerCase().replace(/\\s+/g, '-');
                if (normalizedLang === '.net') {
                    normalizedLang = 'dotnet';
                }
                div.innerHTML = \`
                    <input type="checkbox" id="lang-\${lang}" value="\${lang}">
                    <label for="lang-\${lang}">
                        <img src="\${iconMap[normalizedLang] || ''}" class="icon-small" onerror="this.style.display='none'">
                        \${lang}
                    </label>
                \`;
                languagesFilter.appendChild(div);
            });

            const frameworksFilter = document.getElementById('frameworksFilter');
            frameworks.forEach(fw => {
                const div = document.createElement('div');
                div.className = 'checkbox-item';
                const normalizedFw = fw.toLowerCase().replace(/\\s+/g, '-');
                div.innerHTML = \`
                    <input type="checkbox" id="fw-\${fw}" value="\${fw}">
                    <label for="fw-\${fw}">
                        <img src="\${iconMap[normalizedFw] || ''}" class="icon-small" onerror="this.style.display='none'">
                        \${fw}
                    </label>
                \`;
                frameworksFilter.appendChild(div);
            });
        }

        // Filter and sort
        function applyFiltersAndSort() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const category = document.getElementById('categoryFilter').value;
            const industry = document.getElementById('industryFilter').value;
            
            const selectedServices = Array.from(document.querySelectorAll('#servicesFilter input:checked')).map(cb => cb.value);
            const selectedLanguages = Array.from(document.querySelectorAll('#languagesFilter input:checked')).map(cb => cb.value);
            const selectedFrameworks = Array.from(document.querySelectorAll('#frameworksFilter input:checked')).map(cb => cb.value);

            filteredTemplates = templates.filter(template => {
                // Search filter
                const searchMatch = !searchTerm || 
                    template.title.toLowerCase().includes(searchTerm) ||
                    template.description.toLowerCase().includes(searchTerm) ||
                    template.category.toLowerCase().includes(searchTerm) ||
                    template.industry.toLowerCase().includes(searchTerm) ||
                    template.services.some(s => s.toLowerCase().includes(searchTerm)) ||
                    template.languages.some(l => l.toLowerCase().includes(searchTerm)) ||
                    template.frameworks.some(f => f.toLowerCase().includes(searchTerm)) ||
                    template.tags.some(t => t.toLowerCase().includes(searchTerm));

                // Category filter
                const categoryMatch = !category || template.category === category;

                // Industry filter
                const industryMatch = !industry || template.industry === industry;

                // Services filter
                const servicesMatch = selectedServices.length === 0 || 
                    selectedServices.some(s => template.services.includes(s));

                // Languages filter
                const languagesMatch = selectedLanguages.length === 0 || 
                    selectedLanguages.some(l => template.languages.includes(l));

                // Frameworks filter
                const frameworksMatch = selectedFrameworks.length === 0 || 
                    selectedFrameworks.some(f => template.frameworks.includes(f));

                return searchMatch && categoryMatch && industryMatch && servicesMatch && languagesMatch && frameworksMatch;
            });

            // Sort
            switch (currentSort) {
                case 'name-asc':
                    filteredTemplates.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'name-desc':
                    filteredTemplates.sort((a, b) => b.title.localeCompare(a.title));
                    break;
                case 'date-newest':
                    filteredTemplates.sort((a, b) => new Date(b.lastCommitDate) - new Date(a.lastCommitDate));
                    break;
                case 'date-oldest':
                    filteredTemplates.sort((a, b) => new Date(a.lastCommitDate) - new Date(b.lastCommitDate));
                    break;
            }

            renderGallery();
        }

        // Render gallery
        function renderGallery() {
            const grid = document.getElementById('galleryGrid');
            const noResults = document.getElementById('noResults');

            if (filteredTemplates.length === 0) {
                grid.style.display = 'none';
                noResults.style.display = 'block';
                return;
            }

            grid.style.display = 'grid';
            noResults.style.display = 'none';
            grid.innerHTML = '';

            filteredTemplates.forEach(template => {
                const card = createTemplateCard(template);
                grid.appendChild(card);
            });
        }

        function truncate(str, maxLength) {
            return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
        }

        function createTemplateCard(template) {
            const card = document.createElement('div');
            card.className = 'template-card';

            const playButton = template.videoUrl ? \`
                <button class="play-button" onclick="playVideo('\${template.videoUrl}')">▶</button>
            \` : '';

            const servicesBadges = template.services.map(service => {
                const normalized = service.toLowerCase().replace(/\\s+/g, '-');
                const icon = iconMap[normalized] ? \`<img src="\${iconMap[normalized]}" class="icon-small">\` : '';
                return \`<span class="badge-service">\${icon}\${service}</span>\`;
            }).join('');

            const languagesBadges = template.languages.map(lang => {
                // Special case for .NET to map to dotnet icon
                let normalized = lang.toLowerCase().replace(/\\s+/g, '-');
                if (normalized === '.net') {
                    normalized = 'dotnet';
                }
                const icon = iconMap[normalized] ? \`<img src="\${iconMap[normalized]}" class="icon-small">\` : '';
                return \`<span class="badge-language">\${icon}\${lang}</span>\`;
            }).join('');

            const frameworksBadges = template.frameworks.map(fw => {
                const normalized = fw.toLowerCase().replace(/\\s+/g, '-');
                const icon = iconMap[normalized] ? \`<img src="\${iconMap[normalized]}" class="icon-small">\` : '';
                return \`<span class="badge-framework">\${icon}\${fw}</span>\`;
            }).join('');

            const tagsBadges = template.tags.map(tag => \`<span class="badge-tag">\${tag}</span>\`).join('');

            const authors = template.authors && template.authors.length > 0 
                ? template.authors.map(author => 
                    author.githubHandle 
                        ? \`<a href="#" class="author-link" onclick="openGitHub('https://github.com/\${author.githubHandle}'); return false;">\${author.name || author.githubHandle}</a>\`
                        : (author.name || 'Unknown')
                  ).join(', ')
                : 'Unknown';

            const date = new Date(template.lastCommitDate);
            const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            const versionBadge = template.version ? \`<span class="badge badge-version">v\${template.version}</span>\` : '';

            card.innerHTML = \`
                <div class="thumbnail-container">
                    <img src="\${template.thumbnailUrl}" alt="\${template.title}">
                    \${playButton}
                </div>
                <div class="card-content">
                    <div class="card-title" onclick="showDetails('\${template.name}')">
                        \${truncate(template.title, 40)}
                    </div>
                    <div class="card-description">
                        \${truncate(template.description, 140)}
                    </div>
                    <div class="card-authors">
                        By: \${authors}
                    </div>
                    <div class="card-meta">
                        \${versionBadge}
                        <span class="badge">Last updated: \${formattedDate}</span>
                    </div>
                    <div class="card-meta">
                        <span class="badge badge-category">\${template.category}</span>
                        <span class="badge badge-industry">\${template.industry}</span>
                    </div>
                    <div class="badge-section">
                        \${servicesBadges}
                    </div>
                    <div class="badge-section">
                        \${languagesBadges}
                    </div>
                    <div class="badge-section">
                        \${frameworksBadges}
                    </div>
                    <div class="badge-section">
                        \${tagsBadges}
                    </div>
                    <div class="card-actions">
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="openGitHub('\${template.repoUrl}')">
                                <img src="\${githubIcon}" class="icon-btn">
                                View on GitHub
                            </button>
                            <button class="btn btn-secondary" onclick="starRepo('\${template.repoUrl}')">
                                ⭐ \${template.stars !== undefined ? template.stars : 'Star'}
                            </button>
                            <button class="btn btn-secondary" onclick="shareTemplate('\${template.name}', this)">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M13.5 1a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11 2.5a2.5 2.5 0 11.603 1.628l-6.718 3.12a2.499 2.499 0 010 1.504l6.718 3.12a2.5 2.5 0 11-.488.876l-6.718-3.12a2.5 2.5 0 110-3.256l6.718-3.12A2.5 2.5 0 0111 2.5zm-8.5 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm11 5.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"></path>
                                </svg>
                            </button>
                        </div>
                        <button class="btn btn-primary" onclick="useTemplate('\${template.name}')">
                            Clone Template
                        </button>
                    </div>
                </div>
            \`;

            return card;
        }

        function openGitHub(url) {
            vscode.postMessage({ command: 'openExternal', url });
        }

        function starRepo(repoUrl) {
            // Append /stargazers to open the stargazers page
            const stargazersUrl = repoUrl.endsWith('/') ? repoUrl + 'stargazers' : repoUrl + '/stargazers';
            vscode.postMessage({ command: 'starRepo', repoUrl: stargazersUrl });
        }

        function shareTemplate(templateName, btn) {
            const shareUrl = \`https://aka.ms/spec2cloud?template=\${templateName}\`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                // Show a temporary success message
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓ Copied!';
                btn.style.backgroundColor = 'var(--vscode-testing-iconPassed)';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                vscode.postMessage({ command: 'showError', message: 'Failed to copy link to clipboard' });
            });
        }

        function useTemplate(templateName) {
            vscode.postMessage({ command: 'useTemplate', templateName });
        }

        function playVideo(videoUrl) {
            // Check if it's a YouTube URL
            const youtubeRegex = /(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/;
            const match = videoUrl.match(youtubeRegex);
            
            if (match && match[1]) {
                // YouTube video - open in external browser
                vscode.postMessage({ command: 'openExternal', url: videoUrl });
            } else {
                // Regular video file - play in modal
                const modal = document.getElementById('videoModal');
                const video = document.getElementById('modalVideo');
                video.src = videoUrl;
                video.style.display = 'block';
                modal.classList.add('active');
            }
        }

        function closeVideoModal() {
            const modal = document.getElementById('videoModal');
            const video = document.getElementById('modalVideo');
            
            video.pause();
            video.src = '';
            video.style.display = 'none';
            
            modal.classList.remove('active');
        }

        function showDetails(templateName) {
            const template = templates.find(t => t.name === templateName);
            if (!template) return;

            const modal = document.getElementById('detailsModal');
            const details = document.getElementById('modalDetails');

            const authors = template.authors && template.authors.length > 0 
                ? template.authors.map(author => 
                    author.githubHandle 
                        ? \`<a href="#" class="author-link" onclick="openGitHub('https://github.com/\${author.githubHandle}'); return false;">\${author.name || author.githubHandle}</a>\`
                        : (author.name || 'Unknown')
                  ).join(', ')
                : 'Unknown';

            details.innerHTML = \`
                <h2>\${template.title}</h2>
                <div class="detail-row">
                    <div class="detail-label">Description</div>
                    <div>\${template.description}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Category</div>
                    <div>\${template.category}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Industry</div>
                    <div>\${template.industry}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Authors</div>
                    <div>\${authors}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Version</div>
                    <div>\${template.version}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Last Updated</div>
                    <div>\${new Date(template.lastCommitDate).toLocaleDateString()}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Services</div>
                    <div>\${template.services.join(', ')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Languages</div>
                    <div>\${template.languages.join(', ')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Frameworks</div>
                    <div>\${template.frameworks.join(', ')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Tags</div>
                    <div>\${template.tags.join(', ')}</div>
                </div>
            \`;

            modal.classList.add('active');
        }

        function closeDetailsModal() {
            const modal = document.getElementById('detailsModal');
            modal.classList.remove('active');
        }

        // Event listeners
        document.getElementById('searchInput').addEventListener('input', applyFiltersAndSort);
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFiltersAndSort();
        });
        document.getElementById('categoryFilter').addEventListener('change', applyFiltersAndSort);
        document.getElementById('industryFilter').addEventListener('change', applyFiltersAndSort);
        
        document.getElementById('servicesFilter').addEventListener('change', applyFiltersAndSort);
        document.getElementById('languagesFilter').addEventListener('change', applyFiltersAndSort);
        document.getElementById('frameworksFilter').addEventListener('change', applyFiltersAndSort);

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateSearch':
                    document.getElementById('searchInput').value = message.searchTerm;
                    applyFiltersAndSort();
                    break;
            }
        });

        // Initialize
        initializeFilters();
        applyFiltersAndSort();
    </script>
</body>
</html>`;
    }
}
