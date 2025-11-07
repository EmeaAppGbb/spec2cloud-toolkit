import * as vscode from 'vscode';
import { TemplateService, SpecTemplate } from '../services/templateService';

export class GalleryViewProvider {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private templateService: TemplateService
    ) {}

    public async show(searchTerm: string = '', category: string = 'All', industry: string = 'All'): Promise<void> {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            // Update the gallery with new search parameters
            await this.handleSearch(searchTerm, category, industry, 'name', 'asc', 50);
            // Send message to update the UI controls
            this.panel.webview.postMessage({
                command: 'setSearchParams',
                searchTerm: searchTerm,
                category: category,
                industry: industry
            });
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'spec2cloudGallery',
            '🚀 Spec2Cloud Template Gallery',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Load templates with initial search parameters
        const templates = await this.templateService.searchTemplates(searchTerm, category, industry);

        this.panel.webview.html = this.getHtmlContent(templates, searchTerm, category, industry);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'search':
                        await this.handleSearch(message.searchTerm, message.category, message.industry, message.sortBy, message.sortOrder, message.maxItems);
                        break;
                    case 'viewOnGitHub':
                        await this.handleViewOnGitHub(message.template);
                        break;
                    case 'useTemplate':
                        await this.handleUseTemplate(message.template);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    private async handleSearch(searchTerm: string, category: string, industry: string, sortBy: string, sortOrder: string, maxItems: number): Promise<void> {
        let templates = await this.templateService.searchTemplates(searchTerm, category, industry);
        
        // Sort templates
        templates = this.sortTemplates(templates, sortBy, sortOrder);
        
        // Limit results
        templates = templates.slice(0, maxItems);

        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'updateTemplates',
                templates: templates
            });
        }
    }

    private sortTemplates(templates: SpecTemplate[], sortBy: string, sortOrder: string): SpecTemplate[] {
        const sorted = [...templates];
        
        if (sortBy === 'name') {
            sorted.sort((a, b) => {
                const comparison = a.title.localeCompare(b.title);
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        } else if (sortBy === 'date') {
            sorted.sort((a, b) => {
                const dateA = a.lastCommitDate ? new Date(a.lastCommitDate).getTime() : 0;
                const dateB = b.lastCommitDate ? new Date(b.lastCommitDate).getTime() : 0;
                const comparison = dateB - dateA; // newest first by default
                return sortOrder === 'newest' ? comparison : -comparison;
            });
        }
        
        return sorted;
    }

    private async handleViewOnGitHub(template: SpecTemplate): Promise<void> {
        await this.templateService.viewTemplateOnGitHub(template);
    }

    private async handleUseTemplate(template: SpecTemplate): Promise<void> {
        await this.templateService.useTemplate(template);
    }

    private getHtmlContent(templates: SpecTemplate[], searchTerm: string = '', category: string = 'All', industry: string = 'All'): string {
        const templatesJson = JSON.stringify(templates);
        const initialSearchTerm = searchTerm.replace(/"/g, '&quot;');
        const initialCategory = category.replace(/"/g, '&quot;');
        const initialIndustry = industry.replace(/"/g, '&quot;');
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Spec2Cloud Template Gallery</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--vscode-editor-background);
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
            color: var(--vscode-editor-foreground);
        }

        .search-bar {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
        }

        .search-input {
            flex: 1;
            min-width: 250px;
            padding: 10px 14px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            font-size: 14px;
        }

        .search-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        select {
            padding: 10px 14px;
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
        }

        select:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .search-btn {
            padding: 10px 24px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }

        .search-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .clear-btn {
            padding: 10px 24px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }

        .clear-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .results-info {
            margin: 20px 0;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }

        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 10px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            flex-direction: column;
        }

        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .card-thumbnail {
            width: 100%;
            height: 180px;
            background: #1e1e1e;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            padding: 10px;
        }

        .card-thumbnail img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
        }

        .card-thumbnail-fallback {
            font-size: 48px;
            color: var(--vscode-button-foreground);
        }

        .card-body {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .card-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--vscode-editor-foreground);
        }

        .card-description {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 16px;
            line-height: 1.5;
            flex: 1;
        }

        .card-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
            font-size: 12px;
        }

        .badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .card-footer {
            display: flex;
            gap: 10px;
            padding-top: 16px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .btn {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .no-results-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Spec2Cloud Template Gallery</h1>
        <div class="search-bar">
            <input type="text" id="searchInput" class="search-input" placeholder="Search templates..." value="${initialSearchTerm}">
            <select id="categoryFilter">
                <option value="All">All Categories</option>
            </select>
            <select id="industryFilter">
                <option value="All">Cross Industries</option>
            </select>
            <select id="sortBy">
                <option value="name-asc">Alphabetical (A-Z)</option>
                <option value="name-desc">Alphabetical (Z-A)</option>
                <option value="date-newest">Newest First</option>
                <option value="date-oldest">Oldest First</option>
            </select>
            <select id="maxItems">
                <option value="10">10 items</option>
                <option value="20" selected>20 items</option>
                <option value="30">30 items</option>
            </select>
            <button class="search-btn" onclick="performSearch()">Search</button>
            <button class="clear-btn" onclick="clearFilters()">Clear</button>
        </div>
    </div>

    <div id="resultsInfo" class="results-info"></div>
    <div id="gallery" class="gallery"></div>

    <script>
        const vscode = acquireVsCodeApi();
        let allTemplates = ${templatesJson};
        let categories = new Set();
        let industries = new Set();

        // Extract unique categories and industries
        allTemplates.forEach(t => {
            categories.add(t.category);
            industries.add(t.industry);
        });

        // Populate filters
        const categoryFilter = document.getElementById('categoryFilter');
        Array.from(categories).sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            if (cat === '${initialCategory}') {
                option.selected = true;
            }
            categoryFilter.appendChild(option);
        });

        const industryFilter = document.getElementById('industryFilter');
        Array.from(industries).sort().forEach(ind => {
            const option = document.createElement('option');
            option.value = ind;
            option.textContent = ind;
            if (ind === '${initialIndustry}') {
                option.selected = true;
            }
            industryFilter.appendChild(option);
        });

        function truncate(str, maxLength) {
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength - 3) + '...';
        }

        function renderTemplates(templates) {
            const gallery = document.getElementById('gallery');
            const resultsInfo = document.getElementById('resultsInfo');
            
            resultsInfo.textContent = \`Showing \${templates.length} template\${templates.length !== 1 ? 's' : ''}\`;

            if (templates.length === 0) {
                gallery.innerHTML = \`
                    <div class="no-results">
                        <div class="no-results-icon">🔍</div>
                        <h2>No templates found</h2>
                        <p>Try adjusting your search criteria</p>
                    </div>
                \`;
                return;
            }

            gallery.innerHTML = templates.map(template => {
                const thumbnailUrl = \`\${template.rawUrl}/\${template.folderPath}/\${template.thumbnail}\`;
                const thumbnailHtml = template.thumbnail 
                    ? \`<img src="\${thumbnailUrl}" alt="\${template.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="card-thumbnail-fallback" style="display:none;">📄</div>\`
                    : \`<div class="card-thumbnail-fallback">📄</div>\`;
                
                return \`
                <div class="card">
                    <div class="card-thumbnail">\${thumbnailHtml}</div>
                    <div class="card-body">
                        <div class="card-title">\${template.title}</div>
                        <div class="card-description">\${truncate(template.description, 120)}</div>
                        <div class="card-meta">
                            <span class="badge">\${template.category}</span>
                            <span class="badge">\${template.industry === 'All' ? 'Cross Industries' : template.industry}</span>
                            <span class="badge">v\${template.version}</span>
                            \${template.lastCommitDate ? \`<span class="badge">📅 \${template.lastCommitDate}</span>\` : ''}
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-secondary" onclick="viewOnGitHub('\${template.id}')">View on GitHub</button>
                            <button class="btn btn-primary" onclick="useTemplate('\${template.id}')" title="This operation will download the Spec Template to your local workspace.">Use Template</button>
                        </div>
                    </div>
                </div>
            \`;
            }).join('');
        }

        function performSearch() {
            const searchTerm = document.getElementById('searchInput').value;
            const category = document.getElementById('categoryFilter').value;
            const industry = document.getElementById('industryFilter').value;
            const sortByValue = document.getElementById('sortBy').value;
            const maxItems = parseInt(document.getElementById('maxItems').value);

            const [sortBy, sortOrder] = sortByValue.split('-');

            vscode.postMessage({
                command: 'search',
                searchTerm,
                category,
                industry,
                sortBy,
                sortOrder,
                maxItems
            });
        }

        function clearFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('categoryFilter').value = 'All';
            document.getElementById('industryFilter').value = 'All';
            document.getElementById('sortBy').value = 'name-asc';
            document.getElementById('maxItems').value = '20';
            performSearch();
        }

        function viewOnGitHub(templateId) {
            const template = allTemplates.find(t => t.id === templateId);
            if (template) {
                vscode.postMessage({
                    command: 'viewOnGitHub',
                    template
                });
            }
        }

        function useTemplate(templateId) {
            const template = allTemplates.find(t => t.id === templateId);
            if (template) {
                vscode.postMessage({
                    command: 'useTemplate',
                    template
                });
            }
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateTemplates') {
                renderTemplates(message.templates);
            } else if (message.command === 'setSearchParams') {
                document.getElementById('searchInput').value = message.searchTerm || '';
                document.getElementById('categoryFilter').value = message.category || 'All';
                document.getElementById('industryFilter').value = message.industry || 'All';
            }
        });

        // Search on Enter key
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Initial render
        renderTemplates(allTemplates);
    </script>
</body>
</html>`;
    }
}
