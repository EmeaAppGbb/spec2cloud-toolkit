# Changelog

All notable changes to the "spec2cloud-toolkit" extension will be documented in this file.

## [0.1.0] - 2025-11-06

### Added
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

### Features
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
