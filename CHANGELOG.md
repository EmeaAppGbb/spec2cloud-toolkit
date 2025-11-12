# Changelog

All notable changes to the "spec2cloud-toolkit" extension will be documented in this file.

## [0.3.0] - 2025-11-12

### Added

#### Configuration
- **Templates Repository Setting**: Configure custom GitHub repository for templates (default: `https://github.com/Azure-Samples/Spec2Cloud`)
- **Resources Configuration**: Customizable resource links in settings
- **Automatic Template Loading**: Templates load on extension startup with progress notification
- **Configuration Change Detection**: Prompts to reload when templates repository changes

#### Views
- **Gallery View**: WebView with banner image and "Open Template Gallery" button
- **Templates Tree View**: Hierarchical list of templates with sorting and actions
- **Template Gallery Page**: Full-featured gallery with search, filters, and rich template cards
- **Resources View**: Minimal tree view for documentation and resource links

#### Template Gallery Features
- **Real-time Search**: Search across title, description, tags, services, languages, and frameworks
- **Smart Filtering**: Filter by category, industry, services, languages, and frameworks
- **Flexible Sorting**: Sort by title (A-Z/Z-A) or date (newest/oldest first)
- **Rich Template Cards**: Display thumbnails, badges, authors, version, and last update date
- **Video Preview**: Modal playback for template demo videos
- **Details Modal**: Full template information without truncation
- **Icon Support**: 60+ Azure service icons, 5 language icons, 4 framework icons
- **Badge System**: Color-coded badges for categories, industries, services, languages, frameworks, and tags
- **Author Links**: Direct links to GitHub profiles
- **Star Repositories**: Quick access to star templates on GitHub

#### Template Actions
- **View on GitHub**: Opens template repository in external browser
- **View Template**: Opens gallery with template pre-selected in search
- **Use Template**: Downloads all template files to workspace with confirmation dialog
- **Safe Downloads**: Never overwrites existing files
- **Progress Indicators**: Shows download progress

#### Sorting & Organization
- **Sort by Name**: Toggle between A-Z and Z-A sorting
- **Sort by Date**: Toggle between newest first and oldest first
- **Refresh Templates**: Reload templates from repository
- **Default Sort**: Templates sorted by newest first

#### MCP Tools Integration
- **spec2cloud-select-template Tool**: Programmatic template search and selection
- **Search Parameters**: Support for searchTerm, category, and industry filters
- **Gallery Integration**: Opens gallery with search term pre-filled
- **JSON Response**: Returns filtered template list

#### UI/UX Enhancements
- **Theme Support**: Full light and dark mode support using VS Code theme colors
- **Responsive Design**: Gallery adapts to different panel sizes
- **Modern UI**: Clean, modern interface with smooth interactions
- **Collapsible Filters**: Space-efficient filter panel
- **Interactive Elements**: No submit buttons needed, real-time updates
- **Truncation with Details**: Smart text truncation with modal for full details

#### Developer Experience
- **Type Safety**: Full TypeScript type definitions
- **Service Architecture**: Modular service-based architecture
- **Error Handling**: User-friendly error messages
- **Configuration Validation**: Validates GitHub repository URLs
- **External Links**: Opens all external links in system browser

### Technical Details

#### New Files
- `src/extension.ts` - Main extension activation and command registration
- `src/types.ts` - TypeScript interfaces and type definitions
- `src/templateService.ts` - Template fetching and downloading from GitHub
- `src/galleryViewProvider.ts` - Simple gallery view implementation
- `src/templatesTreeProvider.ts` - Templates tree view provider
- `src/templateGalleryPanel.ts` - Full gallery page with rich UI
- `src/resourcesTreeProvider.ts` - Resources tree view provider
- `src/mcpToolsProvider.ts` - MCP tool implementation

#### Commands
- `spec2cloud.openGallery` - Open template gallery page
- `spec2cloud.refreshTemplates` - Refresh templates from repository
- `spec2cloud.sortTemplatesByName` - Toggle name sorting
- `spec2cloud.sortTemplatesByDate` - Toggle date sorting
- `spec2cloud.viewTemplateOnGitHub` - Open template on GitHub
- `spec2cloud.viewTemplateInGallery` - View template in gallery
- `spec2cloud.useTemplate` - Download template to workspace
- `spec2cloud.openResource` - Open resource URL
- `spec2cloud.mcp.selectTemplate` - MCP tool command

#### Dependencies
- `axios` - HTTP client for fetching templates and files

### Documentation
- Added `USER_GUIDE.md` - Comprehensive user documentation
- Added `MCP_TOOLS.md` - MCP tool integration guide
- Added `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- Updated `README.md` - Main extension documentation
- Updated `TESTING.md` - Testing instructions

### Resources
- Added 60+ Azure service SVG icons in `resources/services/`
- Added 5 language SVG icons in `resources/languages/`
- Added 4 framework SVG icons in `resources/frameworks/`
- Added `Spec2Cloud-gallery.png` - Gallery banner image

## [0.2.0] - Previous Version

(Previous changelog entries would go here)

## [0.1.0] - Initial Release

(Initial release notes would go here)
