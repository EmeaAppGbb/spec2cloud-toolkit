# Spec2Cloud Toolkit - User Guide

## Overview

The Spec2Cloud Toolkit extension helps you discover, browse, and use Azure specification templates for your projects. It provides a comprehensive gallery of templates with powerful search, filtering, and sorting capabilities.

## Configuration

### Templates Repository

By default, the extension uses `https://github.com/Azure-Samples/Spec2Cloud` as the templates repository. You can configure a different repository in VS Code settings:

1. Open Settings (Ctrl+,)
2. Search for "Spec2Cloud"
3. Update the "Templates Repo" setting

### Resources

You can customize the resources shown in the Resources view by editing the `spec2cloud.resources` setting in your settings.json:

```json
{
  "spec2cloud.resources": [
    {
      "name": "Resource Name",
      "description": "Resource description",
      "url": "https://example.com",
      "icon": "github"
    }
  ]
}
```

The `icon` field should match the name of an SVG file (without extension) in the `resources/services` folder.

## Features

### 1. Gallery View

The Gallery view displays a banner image with a button to open the full Template Gallery.

**Actions:**
- Click "Open Template Gallery" to open the comprehensive gallery page

### 2. Templates Tree View

The Templates view shows a hierarchical list of all available templates.

**Features:**
- View template title, version, and last update date
- Sort templates by name (A-Z or Z-A) or date (newest/oldest first)
- Refresh templates from the repository

**Template Actions:**
- **View on GitHub**: Opens the template repository in your browser
- **View Template**: Opens the gallery with the template pre-selected in search
- **Use Template**: Downloads all template files to your workspace

### 3. Template Gallery Page

The full gallery page provides a rich browsing experience with:

**Search & Discovery:**
- Real-time search across titles, descriptions, tags, services, languages, and frameworks
- No search button needed - results update as you type

**Sorting Options:**
- Title (A-Z)
- Title (Z-A)
- Date (Newest First)
- Date (Oldest First)

**Filters:**
- **Category**: Filter by template category (dropdown)
- **Industry**: Filter by target industry (dropdown)
- **Services**: Multi-select checkboxes for Azure services (blue badges)
- **Languages**: Multi-select checkboxes for programming languages (orange badges)
- **Frameworks**: Multi-select checkboxes for frameworks (purple badges)

**Template Cards:**
Each template card displays:
- Thumbnail image (16:9 aspect ratio)
- Play button for video (if available)
- Title (click to see full details)
- Description (truncated to 140 characters)
- Authors (click to view GitHub profile)
- Version badge
- Last update date
- Category badge (light blue background)
- Industry badge (light purple background)
- Service badges (blue with icons)
- Language badges (orange with icons)
- Framework badges (purple with icons)
- Tag badges (green)

**Card Actions:**
- **View on GitHub**: Opens the template repository
- **Star**: Opens GitHub to star the repository
- **Use Template**: Downloads the template to your workspace

**Modals:**
- **Video Modal**: Click play button to watch template demo video
- **Details Modal**: Click template title to see full template information

### 4. Resources View

The Resources view displays configured links to documentation and helpful resources.

**Features:**
- Minimal space usage at the bottom
- Custom icons from the services folder
- Click to open in external browser

### 5. Use Template

When you click "Use Template" (from tree view or gallery):

1. A confirmation dialog appears: "This will download all the template files to this current workspace. Continue?"
2. Choose "Yes" to proceed or "No" to cancel
3. If "Yes", all template files and subfolders are downloaded
4. Existing files are NOT overwritten
5. Progress is shown during download

## Icons and Badges

The extension uses SVG icons fr the `resources` folder:

- **Services**: `resources/services/` - Azure services and tools (blue badges)
- **Languages**: `resources/languages/` - Programming languages (orange badges)
- **Frameworks**: `resources/frameworks/` - Frameworks and SDKs (purple badges)

Icon filenames use lowercase with hyphens (e.g., `azure-cosmos-db.svg`).

## Tips

1. **Finding Templates**: Use the search box to quickly find templates by any property
2. **Multiple Filters**: Combine category, industry, and technology filters for precise results
3. **Sorting**: Toggle between name and date sorting using the toolbar buttons
4. **Preview**: Watch template videos before using them
5. **Details**: Click template titles to see full information without truncation
6. **Safe Downloads**: Existing files are never overwritten when using a template

## Troubleshooting

### Templates Not Loading

1. Check your internet connection
2. Verify the templates repository URL in settings
3. Click the Refresh button in the Templates view
4. Check the Output panel (View → Output → Spec2Cloud)

### Template Download Fails

1. Ensure you have a workspace folder open
2. Check file permissions in your workspace
3. Verify the template repository is accessible
4. Check the Output panel for detailed error messages

### Icons Not Showing

1. Verify the icon name matches a file in `resources/services`
2. Icon names should be lowercase with hyphens
3. Check that the SVG files are valid

## Keyboard Shortcuts

No keyboard shortcuts are defined by default. You can add custom shortcuts in VS Code:

1. Open Keyboard Shortcuts (Ctrl+K Ctrl+S)
2. Search for "Spec2Cloud"
3. Assign shortcuts to commands

## Contributing

To add templates to the gallery:

1. Create a template folder in your templates repository
2. Add a `templates.json` file with template metadata
3. Include thumbnail images and optional demo videos
4. Follow the template schema (see repository for examples)

## Support

For issues, questions, or suggestions:
- GitHub Issues: https://github.com/EmeaAppGbb/spec2cloud-toolkit/issues
- Template Repository: https://github.com/Azure-Samples/Spec2Cloud

## Theme Support

The extension fully supports VS Code themes:
- Automatically adapts to light and dark themes
- Uses semantic colors from your active theme
- All UI elements respect theme colors
