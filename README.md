# Spec2Cloud Toolkit

A Visual Studio Code extension that helps you discover, browse, and use Spec Templates for cloud development.

## Features

### 🔍 Browse Templates
- Search for Spec Templates from a configured GitHub repository
- Filter by category and industry
- View templates in gallery or list mode

### 📚 Template Management
- View template details directly in VS Code
- Open templates on GitHub
- Copy templates to your workspace with a single click
- Automatic conflict resolution (won't overwrite existing files)

### 🔗 Resources
- Quick access to documentation, guides, and community resources
- Configurable resource links

### 🤖 MCP Tool Integration
- Programmatic access to template search via MCP tools
- `spec2cloud-select-template` tool for automated workflows

## Getting Started

### 1. Configure GitHub Repository

Open VS Code settings and configure the following:

```json
{
  "spec2cloud.githubRepo": "https://github.com/your-org/your-repo",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "templates"
}
```

### 2. Browse Templates

1. Open the Spec2Cloud view in the Activity Bar
2. Use the Browse panel to search for templates
3. Apply filters for category and industry
4. Click the search button to find templates

### 3. Use a Template

1. View search results in the Templates panel
2. Click the "Use Template" button on any template
3. The template will be copied to your workspace

## Configuration

### Extension Settings

- `spec2cloud.githubRepo`: GitHub repository URL where Spec Templates are stored
- `spec2cloud.templatesBranch`: Branch name (default: "main")
- `spec2cloud.templatesFolder`: Folder name where templates are stored (default: "templates")

### Configuration File

Customize categories, industries, and resources by editing `config/spec2cloud.config.json`:

```json
{
  "categories": ["All", "AI Apps & Agents", "App Modernization", "Data Centric Apps"],
  "industries": ["All", "Financial Services", "Healthcare & Life Sciences", ...],
  "resources": [
    {
      "name": "Resource Name",
      "description": "Resource description",
      "url": "https://example.com",
      "icon": "book"
    }
  ]
}
```

## Template Structure

Each Spec Template should have a `README.md` file with the following frontmatter:

```markdown
---
title: Template Title
description: Template description
thumbnail: thumbnail.png
version: 1.0.0
category: AI Apps & Agents
industry: Financial Services
---

# Template Title

Detailed description...
```

## MCP Tool

The extension provides an MCP tool for programmatic access:

```typescript
// Tool: spec2cloud-select-template
{
  "searchTerm": "ai agent",
  "category": "AI Apps & Agents",
  "industry": "All"
}
```

## Requirements

- Visual Studio Code 1.85.0 or higher
- Active internet connection for fetching templates from GitHub

## Known Issues

- Thumbnail images from GitHub repositories may require authentication for private repos
- Large templates may take time to download

## Release Notes

### 1.0.0

Initial release of Spec2Cloud Toolkit

- Browse and search Spec Templates
- Filter by category and industry
- Gallery and list view modes
- Copy templates to workspace
- Resources panel
- MCP tool integration

## Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/spec2cloud/toolkit) to report issues or submit pull requests.

## License

MIT License - See LICENSE file for details

---

**Enjoy using Spec2Cloud Toolkit!** 🚀
