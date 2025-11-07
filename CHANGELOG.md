# Changelog

All notable changes to the "spec2cloud-toolkit" extension will be documented in this file.

## [0.2.0] - 2025-11-07

### Added

- Collapsible right sidebar for advanced filters (languages, services, frameworks)
- SVG icon support with automatic loading from resources folder
- Checkbox-based filter interface replacing dropdown multi-selects
- Enhanced UI layout with main content area and sidebar panel
- Improved visual styling with VS Code theme integration

### Changed

- **Template Gallery Layout**: Restructured to use flex layout with collapsible sidebar
- **Filter Interface**: Replaced complex dropdown multi-selects with simple checkbox lists
- **Icon System**: Implemented SVG icons with emoji fallbacks for better visual identification
- **Search Bar**: Reorganized into two rows for better space utilization
- **Filter Organization**: Moved advanced filters (languages, services, frameworks) to dedicated sidebar

### Improved

- **User Experience**: Cleaner, more intuitive interface with progressive disclosure
- **Visual Design**: Added hover effects, transitions, and proper spacing
- **Accessibility**: Larger click targets and better keyboard navigation
- **Performance**: Eliminated complex dropdown state management
- **Mobile Responsiveness**: Better touch targets and responsive design

### Fixed

- JavaScript syntax errors in template literal generation
- Quote conflicts in embedded HTML/JavaScript code
- SVG icon rendering in filter checkboxes
- Square bracket removal from metadata parsing
- Template literal escaping issues

### Technical

- Enhanced webview HTML generation with proper quote handling
- Improved SVG resource loading with multiple lookup strategies
- Streamlined JavaScript functions for filter management
- Updated CSS architecture for modern layout techniques
- Optimized icon rendering pipeline

## [0.1.0] - 2025-11-06

### Features

- Initial release of Spec2Cloud Toolkit
- Browse view with search functionality
- Category and industry filters
- Templates view with gallery and list modes
- Template actions: View, View on GitHub, Use
- Resources view for quick access to documentation
- MCP tool integration with `spec2cloud-select-template`
- Configuration support for custom categories, industries, and resources
- GitHub repository integration for fetching Spec Templates
- Automatic README.md parsing with frontmatter support
- Template copying to workspace with conflict prevention
- Simple browser integration for viewing templates
- External browser support for GitHub links

### Key Features

- **Browse Panel**: Search templates with advanced filtering
- **Templates Panel**: View search results in gallery or list mode
- **Resources Panel**: Quick access to documentation and resources
- **Smart Template Parsing**: Automatic extraction of metadata from README.md
- **Workspace Integration**: Copy templates without overwriting existing files
- **MCP Support**: Programmatic template selection via MCP tools

### Configuration

- `spec2cloud.githubRepo`: Configure GitHub repository URL
- `spec2cloud.templatesBranch`: Set the branch to fetch templates from
- `spec2cloud.templatesFolder`: Configure the templates folder name

### Known Issues

- Thumbnail images from private GitHub repos may require authentication
- Large templates may take time to download

---

## Future Enhancements

Planned features for future releases:

- Template preview with syntax highlighting
- Template versioning and update notifications
- Template favorites and history
- Advanced search with regex support
- Template comparison tool
- Offline template caching
- Custom template validation
- Template contribution workflow
- Integration with GitHub Actions
- Template analytics and usage tracking
