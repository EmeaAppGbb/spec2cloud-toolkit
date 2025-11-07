# Spec2Cloud Toolkit - Quick Start Guide

Welcome to Spec2Cloud Toolkit! This guide will help you get started quickly.

## Step 1: Install the Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Spec2Cloud Toolkit"
4. Click Install

## Step 2: Configure Your GitHub Repository

The extension needs to know where your Spec Templates are stored.

### Option 1: Using VS Code Settings UI

1. Open Settings (Ctrl+, / Cmd+,)
2. Search for "Spec2Cloud"
3. Set the following:
   - **GitHub Repo**: `https://github.com/your-org/your-repo`
   - **Templates Branch**: `main` (or your preferred branch)
   - **Templates Folder**: `templates` (or your folder name)

### Option 2: Using settings.json

Add this to your `settings.json`:

```json
{
  "spec2cloud.githubRepo": "https://github.com/your-org/your-repo",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "templates"
}
```

## Step 3: Browse Templates

1. Click the Spec2Cloud icon in the Activity Bar (left sidebar)
2. You'll see three panels:
   - **Browse**: Search and filter templates
   - **Templates**: View search results
   - **Resources**: Access documentation

## Step 4: Search for Templates

1. In the Browse panel, click the Search button (🔍)
2. Enter your search term (or leave blank for all templates)
3. Select a category (or "All")
4. Select an industry (or "All")
5. Results will appear in the Templates panel

## Step 5: Use a Template

1. In the Templates panel, find the template you want
2. You have three options:
   - **View** (👁️): Preview in VS Code Simple Browser
   - **View on GitHub** (🔗): Open in external browser
   - **Use** (⬇️): Copy to your workspace

3. Click "Use" to copy the template to your current workspace
   - Files won't be overwritten if they already exist
   - The template folder and `.github` folder (if exists) will be copied

## Step 6: Customize Resources

You can customize the resources shown in the Resources panel:

1. Navigate to your extension folder:
   - Windows: `%USERPROFILE%\.vscode\extensions\spec2cloud-toolkit-*`
   - Mac/Linux: `~/.vscode/extensions/spec2cloud-toolkit-*`

2. Edit `config/spec2cloud.config.json`:

```json
{
  "resources": [
    {
      "name": "My Documentation",
      "description": "Custom docs",
      "url": "https://example.com/docs",
      "icon": "book"
    }
  ]
}
```

## Step 7: Using MCP Tools (Advanced)

If you're using the extension programmatically via MCP:

```typescript
// Call the spec2cloud-select-template tool
await vscode.commands.executeCommand('spec2cloud.mcp.selectTemplate', {
  name: 'spec2cloud-select-template',
  parameters: {
    searchTerm: 'ai agent',
    category: 'AI Apps & Agents',
    industry: 'Financial Services'
  }
});
```

## Tips & Tricks

### Gallery vs List View
- Toggle between gallery and list views using the button in Templates panel
- Gallery view shows more details, list view is more compact

### Refresh Templates
- Click the refresh button (🔄) to reload the templates view

### Keyboard Shortcuts
- You can assign keyboard shortcuts to any command in VS Code's keyboard shortcuts settings

### Template Structure

Your GitHub repository should have this structure:

```
your-repo/
├── templates/
│   ├── template-1/
│   │   ├── README.md
│   │   ├── thumbnail.png
│   │   └── ... (template files)
│   └── template-2/
│       ├── README.md
│       └── ... (template files)
└── .github/
    └── workflows/
        └── ... (optional)
```

Each template's `README.md` should have frontmatter:

```markdown
---
title: My Awesome Template
description: A great template for building things
thumbnail: thumbnail.png
version: 1.0.0
category: AI Apps & Agents
industry: Financial Services
---

# My Awesome Template

Detailed description and instructions...
```

## Troubleshooting

### Templates Not Loading
- Check your GitHub repo URL is correct
- Ensure the templates folder exists in your repo
- Check internet connection
- For private repos, you may need to configure GitHub authentication

### Search Returns No Results
- Try broadening your search (use "All" for category/industry)
- Check that templates have proper metadata in README.md

### Template Copy Fails
- Ensure you have a workspace folder open
- Check file permissions in your workspace
- Large templates may take longer to copy

## Need Help?

- Check the [README](README.md) for detailed documentation
- Visit our [GitHub repository](https://github.com/spec2cloud/toolkit)
- Report issues on GitHub Issues

Happy coding! 🚀
