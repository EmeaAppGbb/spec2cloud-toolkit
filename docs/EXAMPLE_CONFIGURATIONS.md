# Example Configurations

This file contains example configurations for different use cases.

## Basic Configuration

For a public GitHub repository with templates:

```json
{
  "spec2cloud.githubRepo": "https://github.com/my-org/my-templates",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "templates"
}
```

## Custom Branch Configuration

If your templates are in a different branch:

```json
{
  "spec2cloud.githubRepo": "https://github.com/my-org/my-templates",
  "spec2cloud.templatesBranch": "develop",
  "spec2cloud.templatesFolder": "templates"
}
```

## Custom Folder Configuration

If your templates are in a different folder:

```json
{
  "spec2cloud.githubRepo": "https://github.com/my-org/my-repo",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "spec-templates"
}
```

## Complete Workspace Settings Example

Add to your `.vscode/settings.json`:

```json
{
  // Spec2Cloud Toolkit Configuration
  "spec2cloud.githubRepo": "https://github.com/microsoft/azure-samples",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "templates",
  
  // Other workspace settings
  "editor.formatOnSave": true,
  "files.autoSave": "afterDelay"
}
```

## Custom Categories Configuration

Edit `config/spec2cloud.config.json` in the extension folder:

```json
{
  "categories": [
    "All",
    "AI Apps & Agents",
    "App Modernization",
    "Data Centric Apps",
    "Web Applications",
    "Mobile Apps",
    "IoT Solutions"
  ],
  "industries": [
    "All",
    "Financial Services",
    "Healthcare & Life Sciences",
    "Manufacturing",
    "Retail & Consumer Goods",
    "Government & Public Sector",
    "Education",
    "Energy & Resources",
    "Telco & Media",
    "Mobility & Automotive"
  ],
  "resources": [
    {
      "name": "Company Documentation",
      "description": "Internal documentation portal",
      "url": "https://docs.company.com",
      "icon": "book"
    },
    {
      "name": "GitHub Repository",
      "description": "View source code and contribute",
      "url": "https://github.com/company/templates",
      "icon": "github"
    },
    {
      "name": "Template Guidelines",
      "description": "How to create and submit templates",
      "url": "https://company.com/template-guidelines",
      "icon": "checklist"
    },
    {
      "name": "Support Portal",
      "description": "Get help and report issues",
      "url": "https://support.company.com",
      "icon": "question"
    }
  ]
}
```

## Common Icon Names

For resources configuration, you can use these VS Code icon names:

- `book` - Documentation
- `github` - GitHub links
- `link` - General links
- `rocket` - Getting started
- `question` - Help/Support
- `checklist` - Guidelines
- `comment-discussion` - Community
- `tools` - Tools/Utilities
- `mortar-board` - Education/Training
- `video` - Video tutorials
- `file-code` - Code samples
- `package` - Downloads

## Multi-Organization Setup

For teams working with multiple template repositories, you can switch between them:

### Organization A Templates

```json
{
  "spec2cloud.githubRepo": "https://github.com/org-a/templates",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "templates"
}
```

### Organization B Templates

```json
{
  "spec2cloud.githubRepo": "https://github.com/org-b/templates",
  "spec2cloud.templatesBranch": "production",
  "spec2cloud.templatesFolder": "spec-templates"
}
```

Switch by updating your workspace settings.

## Testing Configuration

For local development and testing:

```json
{
  "spec2cloud.githubRepo": "https://github.com/your-username/test-templates",
  "spec2cloud.templatesBranch": "dev",
  "spec2cloud.templatesFolder": "test-templates"
}
```

## Production Configuration

For production use:

```json
{
  "spec2cloud.githubRepo": "https://github.com/company/production-templates",
  "spec2cloud.templatesBranch": "stable",
  "spec2cloud.templatesFolder": "templates"
}
```

## Tips

1. **Per-Project Settings**: Create `.vscode/settings.json` in each project for project-specific template repos
2. **User Settings**: Set default in user settings for personal templates
3. **Workspace Settings**: Override in workspace settings for team templates
4. **Version Control**: Commit `.vscode/settings.json` to share team configuration

## Troubleshooting

### Wrong Repository
If you see "No templates found":
1. Check the repository URL is correct
2. Verify the branch exists
3. Confirm the templates folder name matches
4. Ensure the repository is public (or add authentication)

### Rate Limits
If you hit GitHub API rate limits:
1. Wait for the limit to reset (1 hour)
2. Add authentication (future feature)
3. Use a different account

### Templates Not Updating
To force refresh:
1. Change any configuration value
2. Reload VS Code
3. Or update the configuration back to original

## Example Template Repositories

Public repositories you can try:

```json
{
  "spec2cloud.githubRepo": "https://github.com/Azure-Samples/azure-quickstart-templates",
  "spec2cloud.templatesBranch": "master",
  "spec2cloud.templatesFolder": "quickstarts"
}
```

Or create your own following the structure in `docs/TEMPLATE_STRUCTURE.md`.
