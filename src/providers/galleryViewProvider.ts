import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TemplateService, SpecTemplate } from '../services/templateService';

export class GalleryViewProvider {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private templateService: TemplateService
    ) {}

    private async generateSvgMappings(webview: vscode.Webview): Promise<{ languages: any, services: any, frameworks: any }> {
        const resourcesPath = path.join(this.context.extensionPath, 'resources');
        
        const mappings = {
            languages: {} as any,
            services: {} as any,
            frameworks: {} as any
        };

        // Helper function to load SVG files from a directory
        const loadSvgFiles = async (dirPath: string, mapping: any) => {
            try {
                if (fs.existsSync(dirPath)) {
                    const files = fs.readdirSync(dirPath);
                    for (const file of files) {
                        if (file.endsWith('.svg')) {
                            const filePath = path.join(dirPath, file);
                            const fileName = path.basename(file, '.svg');
                            const uri = webview.asWebviewUri(vscode.Uri.file(filePath));
                            
                            // Create multiple lookup keys for better matching
                            const keys = [
                                fileName.toLowerCase(),
                                fileName.toLowerCase().replace(/\s+/g, ''),
                                fileName.toLowerCase().replace(/\s+/g, ' ').trim()
                            ];
                            
                            keys.forEach(key => {
                                mapping[key] = uri.toString();
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error loading SVG files from ${dirPath}:`, error);
            }
        };

        // Load SVG files for each category
        await loadSvgFiles(path.join(resourcesPath, 'languages'), mappings.languages);
        await loadSvgFiles(path.join(resourcesPath, 'services'), mappings.services);
        await loadSvgFiles(path.join(resourcesPath, 'frameworks'), mappings.frameworks);

        return mappings;
    }

    public async show(
        searchTerm: string = '', 
        category: string = 'All', 
        industry: string = 'All',
        languages: string[] = [],
        services: string[] = [],
        frameworks: string[] = []
    ): Promise<void> {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            // Update the gallery with new search parameters
            await this.handleSearch(searchTerm, category, industry, languages, services, frameworks, 'name', 'asc', 50);
            // Send message to update the UI controls
            this.panel.webview.postMessage({
                command: 'setSearchParams',
                searchTerm: searchTerm,
                category: category,
                industry: industry,
                languages: languages,
                services: services,
                frameworks: frameworks
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
        const templates = await this.templateService.searchTemplates(searchTerm, category, industry, languages, services, frameworks);

        this.panel.webview.html = await this.getHtmlContent(this.panel.webview, templates, searchTerm, category, industry, languages, services, frameworks);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'search':
                        await this.handleSearch(
                            message.searchTerm, 
                            message.category, 
                            message.industry, 
                            message.languages || [],
                            message.services || [],
                            message.frameworks || [],
                            message.sortBy, 
                            message.sortOrder, 
                            message.maxItems
                        );
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

    private async handleSearch(
        searchTerm: string, 
        category: string, 
        industry: string, 
        languages: string[],
        services: string[],
        frameworks: string[],
        sortBy: string, 
        sortOrder: string, 
        maxItems: number
    ): Promise<void> {
        let templates = await this.templateService.searchTemplates(searchTerm, category, industry, languages, services, frameworks);
        
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

    private async getUniqueCategories(): Promise<string[]> {
        const allTemplates = await this.templateService.fetchTemplates();
        const categoriesSet = new Set<string>();
        allTemplates.forEach(template => categoriesSet.add(template.category));
        return Array.from(categoriesSet).sort();
    }

    private async getUniqueIndustries(): Promise<string[]> {
        const allTemplates = await this.templateService.fetchTemplates();
        const industriesSet = new Set<string>();
        allTemplates.forEach(template => industriesSet.add(template.industry));
        return Array.from(industriesSet).sort();
    }

    private async getHtmlContent(
        webview: vscode.Webview,
        templates: SpecTemplate[], 
        searchTerm: string = '', 
        category: string = 'All', 
        industry: string = 'All',
        languages: string[] = [],
        services: string[] = [],
        frameworks: string[] = []
    ): Promise<string> {
        // Fetch filter options
        const [allCategories, allIndustries, allLanguages, allServices, allFrameworks] = await Promise.all([
            this.getUniqueCategories(),
            this.getUniqueIndustries(),
            this.templateService.getUniqueLanguages(),
            this.templateService.getUniqueServices(),
            this.templateService.getUniqueFrameworks()
        ]);

        const templatesJson = JSON.stringify(templates);
        const initialSearchTerm = searchTerm.replace(/"/g, '&quot;');
        const initialCategory = category.replace(/"/g, '&quot;');
        const initialIndustry = industry.replace(/"/g, '&quot;');
        const initialLanguages = JSON.stringify(languages);
        const initialServices = JSON.stringify(services);
        const initialFrameworks = JSON.stringify(frameworks);
        const categoriesJson = JSON.stringify(allCategories);
        const industriesJson = JSON.stringify(allIndustries);
        const languagesJson = JSON.stringify(allLanguages);
        const servicesJson = JSON.stringify(allServices);
        const frameworksJson = JSON.stringify(allFrameworks);
        
        // Generate SVG mappings for webview
        const svgMappings = await this.generateSvgMappings(webview);
        const svgMappingsJson = JSON.stringify(svgMappings);
        
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
            padding: 0;
            margin: 0;
            height: 100vh;
            overflow: hidden;
        }

        .main-container {
            display: flex;
            height: 100vh;
        }

        .content-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
        }

        .sidebar {
            width: 320px;
            background: var(--vscode-sideBar-background);
            border-left: 1px solid var(--vscode-panel-border);
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease;
            position: fixed;
            right: 0;
            top: 0;
            height: 100vh;
            z-index: 999;
        }

        .sidebar.collapsed {
            transform: translateX(100%);
        }

        .sidebar-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--vscode-sideBar-background);
        }

        .sidebar-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-sideBar-foreground);
        }

        .sidebar-close {
            background: none;
            border: none;
            color: var(--vscode-sideBar-foreground);
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 16px;
        }

        .sidebar-close:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }

        .sidebar-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }

        .sidebar-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .sidebar-toggle:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .sidebar-toggle.hidden {
            display: none;
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
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
        }

        .search-row {
            display: flex;
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
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio (9/16 = 0.5625) */
            background: #1e1e1e;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        .card-thumbnail img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover; /* Changed from contain to cover for better 16:9 display */
        }

        .card-thumbnail-fallback {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
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

        .filter-group {
            margin-bottom: 24px;
        }

        .filter-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--vscode-sideBar-foreground);
        }

        .filter-group .multi-select {
            width: 100%;
        }

        .checkbox-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-input-background);
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .checkbox-item:last-child {
            border-bottom: none;
        }

        .checkbox-item:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .checkbox-item input[type="checkbox"] {
            margin: 0;
            flex-shrink: 0;
        }

        .checkbox-item label {
            flex: 1;
            cursor: pointer;
            font-size: 13px;
            color: var(--vscode-input-foreground);
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
        }

        .checkbox-item .icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
        }

        .checkbox-item img {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            object-fit: contain;
        }

        .checkbox-item span {
            flex: 1;
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

        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 16px;
        }

        .tech-item {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #3366cc;
            border-radius: 50%;
            font-size: 16px;
            color: white;
            cursor: help;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .tech-item:hover {
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(51, 102, 204, 0.3);
        }

        .tech-icon {
            font-size: 16px;
            line-height: 1;
        }

        .tech-icon img {
            width: 20px !important;
            height: 20px !important;
            object-fit: contain;
            filter: brightness(0) invert(1); /* Make SVGs white to match the background */
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .filter-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="content-area">
            <div class="header">
                <h1>🚀 Spec2Cloud Template Gallery</h1>
                <div class="search-bar">
                    <div class="search-row">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search templates..." value="${initialSearchTerm}">
                        <button class="search-btn" onclick="performSearch()">Search</button>
                        <button class="clear-btn" onclick="clearFilters()">Clear</button>
                    </div>
                    <div class="search-row">
                        <div class="filter-group">
                            <label class="filter-label">Category</label>
                            <select id="categoryFilter">
                                <option value="All">All Categories</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Industry</label>
                            <select id="industryFilter">
                                <option value="All">Cross Industries</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Sort By</label>
                            <select id="sortBy">
                                <option value="name-asc">Alphabetical (A-Z)</option>
                                <option value="name-desc">Alphabetical (Z-A)</option>
                                <option value="date-newest">Newest First</option>
                                <option value="date-oldest">Oldest First</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Items</label>
                            <select id="maxItems">
                                <option value="10">10 items</option>
                                <option value="20" selected>20 items</option>
                                <option value="30">30 items</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div id="resultsInfo" class="results-info"></div>
            <div id="gallery" class="gallery"></div>
        </div>

        <button class="sidebar-toggle" onclick="toggleSidebar()">Advanced Filters</button>

        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title">Advanced Filters</div>
                <button class="sidebar-close" onclick="toggleSidebar()">✕</button>
            </div>
            <div class="sidebar-content">
                <div class="filter-group">
                    <label class="filter-label">Languages</label>
                    <div class="checkbox-list" id="languagesFilter">
                        <!-- Languages will be populated by JavaScript -->
                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Services</label>
                    <div class="checkbox-list" id="servicesFilter">
                        <!-- Services will be populated by JavaScript -->
                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Frameworks</label>
                    <div class="checkbox-list" id="frameworksFilter">
                        <!-- Frameworks will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let allTemplates = ${templatesJson};
        let categories = ${categoriesJson};
        let industries = ${industriesJson};
        let languages = ${languagesJson};
        let services = ${servicesJson};
        let frameworks = ${frameworksJson};
        let svgMappings = ${svgMappingsJson};
        
        let selectedLanguages = ${initialLanguages};
        let selectedServices = ${initialServices};
        let selectedFrameworks = ${initialFrameworks};

        // Sidebar toggle functionality
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.querySelector('.sidebar-toggle');
            
            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
                toggleBtn.classList.add('hidden');
            } else {
                sidebar.classList.add('collapsed');
                toggleBtn.classList.remove('hidden');
            }
        }

        // Initialize sidebar as collapsed
        document.addEventListener('DOMContentLoaded', function() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.add('collapsed');
        });

        // Populate single-select filters
        const categoryFilter = document.getElementById("categoryFilter");
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            if (cat === "${initialCategory}") {
                option.selected = true;
            }
            categoryFilter.appendChild(option);
        });

        const industryFilter = document.getElementById("industryFilter");
        industries.forEach(ind => {
            const option = document.createElement("option");
            option.value = ind;
            option.textContent = ind;
            if (ind === "${initialIndustry}") {
                option.selected = true;
            }
            industryFilter.appendChild(option);
        });

        // Populate checkbox filters
        function setupCheckboxList(filterId, options, selectedItems) {
            const container = document.getElementById(filterId);
            
            // Determine the type based on the filter ID
            let iconType = "language";
            if (filterId === "servicesFilter") {
                iconType = "service";
            } else if (filterId === "frameworksFilter") {
                iconType = "framework";
            }
            
            options.forEach(option => {
                const div = document.createElement("div");
                div.className = "checkbox-item";
                
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = option;
                checkbox.id = filterId + "_" + option.replace(/[^a-zA-Z0-9]/g, '_');
                checkbox.checked = selectedItems.includes(option);
                
                const label = document.createElement("label");
                label.htmlFor = checkbox.id;
                
                // Get the correct icon data and render it
                const iconData = getSvgIcon(iconType, option);
                const iconHtml = renderIcon(iconData, option);
                
                label.innerHTML = iconHtml + "<span>" + option + "</span>";
                
                div.appendChild(checkbox);
                div.appendChild(label);
                container.appendChild(div);
                
                // Handle checkbox changes
                checkbox.addEventListener("change", () => {
                    if (filterId === "languagesFilter") {
                        selectedLanguages = getSelectedCheckboxValues(container);
                    } else if (filterId === "servicesFilter") {
                        selectedServices = getSelectedCheckboxValues(container);
                    } else if (filterId === "frameworksFilter") {
                        selectedFrameworks = getSelectedCheckboxValues(container);
                    }
                    performSearch();
                });
            });
        }

        function getSelectedCheckboxValues(container) {
            return Array.from(container.querySelectorAll("input[type=\\"checkbox\\"]:checked")).map(input => input.value);
        }

        // Setup checkbox filters
        setupCheckboxList("languagesFilter", languages, selectedLanguages);
        setupCheckboxList("servicesFilter", services, selectedServices);
        setupCheckboxList("frameworksFilter", frameworks, selectedFrameworks);

        function getSvgIcon(type, name) {
            // Helper function to normalize names for lookup
            const normalizeKey = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizeKeyNoSpaces = (str) => str.toLowerCase().replace(/\s+/g, '');
            
            // Try to find exact SVG match with multiple strategies
            let svgUrl = null;
            if (type === "language" && svgMappings.languages) {
                svgUrl = svgMappings.languages[normalizeKey(name)] || 
                        svgMappings.languages[normalizeKeyNoSpaces(name)] ||
                        svgMappings.languages[name.toLowerCase()];
            } else if (type === "service" && svgMappings.services) {
                svgUrl = svgMappings.services[normalizeKey(name)] || 
                        svgMappings.services[normalizeKeyNoSpaces(name)] ||
                        svgMappings.services[name.toLowerCase()];
            } else if (type === "framework" && svgMappings.frameworks) {
                svgUrl = svgMappings.frameworks[normalizeKey(name)] || 
                        svgMappings.frameworks[normalizeKeyNoSpaces(name)] ||
                        svgMappings.frameworks[name.toLowerCase()];
            }
            
            // Return object with URL and type information
            if (svgUrl) {
                return { type: "svg", url: svgUrl };
            }
            
            // Fallback to emoji icons if no SVG found
            if (type === "language") {
                switch (name.toLowerCase()) {
                    case "javascript":
                    case "js": return { type: "emoji", icon: "🟨" };
                    case "typescript":
                    case "ts": return { type: "emoji", icon: "🔷" };
                    case "python": return { type: "emoji", icon: "🐍" };
                    case "java": return { type: "emoji", icon: "☕" };
                    case "csharp":
                    case "c#": return { type: "emoji", icon: "🟣" };
                    case "go": return { type: "emoji", icon: "🐹" };
                    case "rust": return { type: "emoji", icon: "🦀" };
                    case "php": return { type: "emoji", icon: "🐘" };
                    case "ruby": return { type: "emoji", icon: "💎" };
                    case "swift": return { type: "emoji", icon: "🐦" };
                    case "kotlin": return { type: "emoji", icon: "🎯" };
                    default: return { type: "emoji", icon: "💻" };
                }
            } else if (type === "service") {
                switch (name.toLowerCase()) {
                    case "azure functions": return { type: "emoji", icon: "⚡" };
                    case "azure app service": return { type: "emoji", icon: "🌐" };
                    case "azure storage": return { type: "emoji", icon: "💾" };
                    case "azure cosmos db": return { type: "emoji", icon: "🌌" };
                    case "azure sql": return { type: "emoji", icon: "🗄️" };
                    case "azure service bus": return { type: "emoji", icon: "📨" };
                    case "azure event hubs": return { type: "emoji", icon: "📡" };
                    case "azure key vault": return { type: "emoji", icon: "🔐" };
                    case "azure monitor": return { type: "emoji", icon: "📊" };
                    case "azure logic apps": return { type: "emoji", icon: "🔗" };
                    default: return { type: "emoji", icon: "☁️" };
                }
            } else if (type === "framework") {
                switch (name.toLowerCase()) {
                    case "react": return { type: "emoji", icon: "⚛️" };
                    case "angular": return { type: "emoji", icon: "🅰️" };
                    case "vue": return { type: "emoji", icon: "🟢" };
                    case "express": return "�";
                    case "spring": return { type: "emoji", icon: "🍃" };
                    case "django": return { type: "emoji", icon: "🎸" };
                    case "flask": return { type: "emoji", icon: "🍶" };
                    case "dotnet":
                    case ".net": return { type: "emoji", icon: "🔵" };
                    case "laravel": return { type: "emoji", icon: "🎭" };
                    case "rails": return { type: "emoji", icon: "🛤️" };
                    default: return { type: "emoji", icon: "🔧" };
                }
            }
            return { type: "emoji", icon: "🔧" }; // fallback
        }

        function renderIcon(iconData, name) {
            if (iconData.type === "svg") {
                return "<img src=\\"" + iconData.url + "\\" alt=\\"" + name + "\\" style=\\"width: 20px; height: 20px;\\" />";
            } else {
                return iconData.icon;
            }
        }

        function createTechStackHtml(template) {
            const techItems = [];
            
            // Add languages (icon only)
            template.languages.forEach(lang => {
                const iconData = getSvgIcon("language", lang);
                techItems.push(
                    "<div class=\\"tech-item\\" title=\\"" + lang + "\\">" +
                        "<span class=\\"tech-icon\\">" + renderIcon(iconData, lang) + "</span>" +
                    "</div>"
                );
            });
            
            // Add services (icon only)
            template.services.forEach(service => {
                const iconData = getSvgIcon("service", service);
                techItems.push(
                    "<div class=\\"tech-item\\" title=\\"" + service + "\\">" +
                        "<span class=\\"tech-icon\\">" + renderIcon(iconData, service) + "</span>" +
                    "</div>"
                );
            });
            
            // Add frameworks (icon only)
            template.frameworks.forEach(framework => {
                const iconData = getSvgIcon("framework", framework);
                techItems.push(
                    "<div class=\\"tech-item\\" title=\\"" + framework + "\\">" +
                        "<span class=\\"tech-icon\\">" + renderIcon(iconData, framework) + "</span>" +
                    "</div>"
                );
            });
            
            return techItems.length > 0 ? "<div class=\\"tech-stack\\">" + techItems.join("") + "</div>" : "";
        }

        function truncate(str, maxLength) {
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength - 3) + "...";
        }

        function renderTemplates(templates) {
            const gallery = document.getElementById("gallery");
            const resultsInfo = document.getElementById("resultsInfo");
            
            resultsInfo.textContent = "Showing " + templates.length + " template" + (templates.length !== 1 ? "s" : "");

            if (templates.length === 0) {
                gallery.innerHTML = 
                    "<div class=\\"no-results\\">" +
                        "<div class=\\"no-results-icon\\">🔍</div>" +
                        "<h2>No templates found</h2>" +
                        "<p>Try adjusting your search criteria</p>" +
                    "</div>";
                return;
            }

            gallery.innerHTML = templates.map(template => {
                const thumbnailUrl = template.rawUrl + "/" + template.folderPath + "/" + template.thumbnail;
                const thumbnailHtml = template.thumbnail 
                    ? "<img src=\\"" + thumbnailUrl + "\\" alt=\\"" + template.title + "\\" onerror=\\"this.style.display='none'; this.nextElementSibling.style.display='flex';\\" /><div class=\\"card-thumbnail-fallback\\" style=\\"display:none;\\">📄</div>"
                    : "<div class=\\"card-thumbnail-fallback\\">📄</div>";
                
                return "<div class=\\"card\\">" +
                    "<div class=\\"card-thumbnail\\">" + thumbnailHtml + "</div>" +
                    "<div class=\\"card-body\\">" +
                        "<div class=\\"card-title\\">" + template.title + "</div>" +
                        "<div class=\\"card-description\\">" + truncate(template.description, 120) + "</div>" +
                        createTechStackHtml(template) +
                        "<div class=\\"card-meta\\">" +
                            "<span class=\\"badge\\">" + template.category + "</span>" +
                            "<span class=\\"badge\\">" + (template.industry === "All" ? "Cross Industries" : template.industry) + "</span>" +
                            "<span class=\\"badge\\">v" + template.version + "</span>" +
                            (template.lastCommitDate ? "<span class=\\"badge\\">📅 " + template.lastCommitDate + "</span>" : "") +
                        "</div>" +
                        "<div class=\\"card-footer\\">" +
                            "<button class=\\"btn btn-secondary\\" onclick=\\"viewOnGitHub('" + template.id + "')\\" >View on GitHub</button>" +
                            "<button class=\\"btn btn-primary\\" onclick=\\"useTemplate('" + template.id + "')\\" title=\\"This operation will download the Spec Template to your local workspace.\\">Use Template</button>" +
                        "</div>" +
                    "</div>" +
                "</div>";
            }).join("");
        }

        function performSearch() {
            const searchTerm = document.getElementById("searchInput").value;
            const category = document.getElementById("categoryFilter").value;
            const industry = document.getElementById("industryFilter").value;
            const sortByValue = document.getElementById("sortBy").value;
            const maxItems = parseInt(document.getElementById("maxItems").value);

            const [sortBy, sortOrder] = sortByValue.split("-");

            vscode.postMessage({
                command: "search",
                searchTerm,
                category,
                industry,
                languages: selectedLanguages,
                services: selectedServices,
                frameworks: selectedFrameworks,
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
            
            // Clear checkbox filters
            selectedLanguages = [];
            selectedServices = [];
            selectedFrameworks = [];
            
            // Update checkbox UI
            document.querySelectorAll(".checkbox-list input[type=\\"checkbox\\"]").forEach(checkbox => {
                checkbox.checked = false;
            });
            
            performSearch();
        }

        function viewOnGitHub(templateId) {
            const template = allTemplates.find(t => t.id === templateId);
            if (template) {
                vscode.postMessage({
                    command: "viewOnGitHub",
                    template
                });
            }
        }

        function useTemplate(templateId) {
            const template = allTemplates.find(t => t.id === templateId);
            if (template) {
                vscode.postMessage({
                    command: "useTemplate",
                    template
                });
            }
        }

        // Handle messages from extension
        window.addEventListener("message", event => {
            const message = event.data;
            if (message.command === "updateTemplates") {
                renderTemplates(message.templates);
            } else if (message.command === "setSearchParams") {
                document.getElementById("searchInput").value = message.searchTerm || "";
                document.getElementById("categoryFilter").value = message.category || "All";
                document.getElementById("industryFilter").value = message.industry || "All";
                
                // Update multi-select filters
                selectedLanguages = message.languages || [];
                selectedServices = message.services || [];
                selectedFrameworks = message.frameworks || [];
                
                // Update checkboxes and button text
                updateMultiSelectFromData("languagesFilter", selectedLanguages, "Any Language");
                updateMultiSelectFromData("servicesFilter", selectedServices, "Any Service");
                updateMultiSelectFromData("frameworksFilter", selectedFrameworks, "Any Framework");
            }
        });

        function updateMultiSelectFromData(filterId, selectedItems, defaultText) {
            const container = document.getElementById(filterId);
            const button = container.querySelector(".multi-select-button span:first-child");
            const dropdown = container.querySelector(".multi-select-dropdown");
            
            // Update checkboxes
            dropdown.querySelectorAll("input[type=\\"checkbox\\"]").forEach(checkbox => {
                checkbox.checked = selectedItems.includes(checkbox.value);
            });
            
            // Update button text
            updateMultiSelectButton(button, selectedItems, defaultText);
        }

        // Search on Enter key
        document.getElementById("searchInput").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
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
