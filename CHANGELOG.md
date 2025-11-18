# Changelog

All notable changes to the "spec2cloud-toolkit" extension will be documented in this file.

## [0.6.0] - 2025-11-18

### Added

- **Azure Cost Estimator Tool**: Integrated Azure Retail Prices API for real-time pricing information
  - Supports filtering by service name, region, currency, price type, and SKU
  - Returns structured JSON with pricing details including retail prices, unit prices, and savings plans
  - Uses Azure Retail Prices API version 2023-01-01-preview
  - No authentication required (public API)

### Changed

- **Search Templates Tool**: Updated output format to include clickable "View Template" links in results
  - Enhanced user experience with direct template navigation from search results

## [0.5.0] - 2025-11-17

### Added

- **MCP Server Definition Provider**: Implemented `mcpServerDefinitionProviders` to make spec2cloud discoverable in VS Code's MCP servers list
  - Added MCP server definition provider registration
  - Created standalone MCP server implementation (`mcpServer.ts`)
  - Exposes `spec2cloud_select_template` tool via MCP protocol
  - Installed `@modelcontextprotocol/sdk` dependency for MCP support
- **Chat Participant Integration**: Added `@spec2cloud` chat participant for GitHub Copilot Chat
  - Use `@spec2cloud find templates for AI` in Copilot Chat
  - Integrates with language model tools API
  - Automatic tool invocation based on user queries
- **Language Model Tools**: Registered `spec2cloud_select_template` as a language model tool
  - Available to language models via `vscode.lm` API
  - Supports searchTerm, category, and industry parameters
  - Returns formatted markdown results with template details
- **Tool Registration Diagnostics**: Added `spec2cloud.checkTools` command to verify MCP tool registration
- **Enhanced Logging**: Added console logging for tool registration and invocation for debugging
- **Gallery UI Enhancements**: 
  - Star counts now display on star buttons (shows actual number from template metadata)
  - Added share button that copies template URL to clipboard with visual feedback

## [0.4.0] - 2025-11-14

### Added
- **Git Clone Integration**: Templates are now cloned directly into workspace using `git clone` 
- **URI Protocol Handler**: Open templates via `vscode://` protocol with template name and action parameters
- **Collapsible Filters Panel**: Filters can be collapsed by default with toggle button next to sort dropdown
- **Relative Date Display**: Tree view shows relative dates (e.g., "2 days ago", "3 weeks ago") instead of absolute dates

## [0.3.0] - 2025-11-12

### Added

#### Views
- **Gallery View**: WebView with banner image and "Open Template Gallery" button
- **Templates Tree View**: List of templates with sorting and actions
- **Template Gallery Page**: Full-featured gallery with search, filters, and rich template cards
- **Resources View**: Minimal tree view for documentation and resource links

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
- `spec2cloud.cloneTemplate` - Download template to workspace
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
