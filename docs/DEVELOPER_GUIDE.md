# Spec2Cloud Toolkit - Developer Guide

This guide is for developers who want to understand, modify, or contribute to the Spec2Cloud Toolkit extension.

## Architecture Overview

### Components

```
spec2cloud-toolkit/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── providers/
│   │   ├── browseViewProvider.ts    # Browse panel tree view
│   │   ├── templatesViewProvider.ts # Templates panel tree view
│   │   └── resourcesViewProvider.ts # Resources panel tree view
│   ├── services/
│   │   ├── configurationService.ts  # Config management
│   │   └── templateService.ts       # Template operations
│   └── mcp/
│       └── mcpServer.ts             # MCP tool integration
├── config/
│   └── spec2cloud.config.json   # Extension configuration
└── resources/
    ├── Spec2Cloud.svg           # Activity bar icon
    └── default-thumbnail.png    # Default template thumbnail
```

### Flow Diagram

```
User Action
    ↓
Extension Activation (extension.ts)
    ↓
    ├── ConfigurationService → Loads config
    ├── TemplateService → Fetches templates
    └── Providers → Renders UI
        ├── BrowseViewProvider → Search UI
        ├── TemplatesViewProvider → Results UI
        └── ResourcesViewProvider → Resources UI
    ↓
User Interaction
    ↓
    ├── Search → TemplateService.searchTemplates()
    ├── View → Open in Simple Browser
    ├── View on GitHub → Open external browser
    └── Use → TemplateService.useTemplate()
        └── Downloads files from GitHub
```

## Key Classes

### ConfigurationService

**Purpose**: Manages extension configuration and settings.

**Key Methods**:
- `getCategories()`: Returns available template categories
- `getIndustries()`: Returns available industries
- `getResources()`: Returns resource items
- `getGitHubRepo()`: Returns configured GitHub repo URL

**Configuration Sources**:
1. VS Code settings (`spec2cloud.*`)
2. Extension config file (`config/spec2cloud.config.json`)

### TemplateService

**Purpose**: Handles all template-related operations.

**Key Methods**:
- `fetchTemplates()`: Fetches all templates from GitHub
- `searchTemplates(searchTerm, category, industry)`: Filters templates
- `viewTemplate(template)`: Opens template in simple browser
- `viewTemplateOnGitHub(template)`: Opens in external browser
- `useTemplate(template)`: Copies template to workspace

**Template Discovery**:
1. Fetch folder list from `templates/` via GitHub API
2. For each folder, fetch `README.md`
3. Parse frontmatter and markdown
4. Build template object with metadata

### BrowseViewProvider

**Purpose**: Provides the Browse tree view UI.

**Features**:
- Search input collection
- Category filter selection
- Industry filter selection
- Triggers template search

**Tree Structure**:
```
Browse
├── Search: [current search term]
├── Category: [current category]
└── Industry: [current industry]
```

### TemplatesViewProvider

**Purpose**: Displays search results in gallery or list view.

**Features**:
- Toggle between gallery and list views
- Shows template cards with metadata
- Provides action buttons (View, GitHub, Use)

**View Modes**:
- **Gallery**: Shows full details with descriptions
- **List**: Compact view with key metadata

### ResourcesViewProvider

**Purpose**: Displays configurable resource links.

**Features**:
- Reads resources from config
- Opens URLs in external browser
- Customizable icons

### MCPServer

**Purpose**: Exposes MCP tool for programmatic access.

**Tool**: `spec2cloud-select-template`

**Parameters**:
- `searchTerm` (optional): Search query
- `category` (optional): Template category
- `industry` (optional): Template industry

**Usage**:
```typescript
await vscode.commands.executeCommand('spec2cloud.mcp.selectTemplate', {
  name: 'spec2cloud-select-template',
  parameters: {
    searchTerm: 'chatbot',
    category: 'AI Apps & Agents',
    industry: 'All'
  }
});
```

## VS Code Extension APIs Used

### Tree View API
- `vscode.window.registerTreeDataProvider()`: Registers tree views
- `TreeDataProvider` interface: Provides tree structure
- `TreeItem`: Represents individual tree items

### Commands API
- `vscode.commands.registerCommand()`: Registers commands
- `vscode.commands.executeCommand()`: Executes commands

### Configuration API
- `vscode.workspace.getConfiguration()`: Reads settings
- Configuration contributions in `package.json`

### File System API
- `vscode.workspace.fs.readFile()`: Reads files
- `vscode.workspace.fs.writeFile()`: Writes files
- `vscode.workspace.fs.stat()`: Checks file existence

### UI APIs
- `vscode.window.showInputBox()`: Shows input dialog
- `vscode.window.showQuickPick()`: Shows selection dialog
- `vscode.window.showInformationMessage()`: Shows info message
- `vscode.window.withProgress()`: Shows progress indicator

### Browser API
- `vscode.commands.executeCommand('simpleBrowser.show')`: Opens simple browser
- `vscode.env.openExternal()`: Opens external browser

## Development Workflow

### Setup

```bash
# Clone the repository
git clone https://github.com/spec2cloud/toolkit.git
cd spec2cloud-toolkit

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### Development

```bash
# Watch mode (auto-compile on changes)
npm run watch
```

In VS Code:
1. Press F5 to launch Extension Development Host
2. Make changes to the code
3. Reload the Extension Development Host (Ctrl+R / Cmd+R)

### Testing

```bash
# Run linting
npm run lint

# Compile and check for errors
npm run compile
```

Manual testing:
1. Configure a test GitHub repository
2. Test search functionality
3. Test template viewing
4. Test template copying
5. Test resource links
6. Test view toggling

### Debugging

1. Set breakpoints in TypeScript files
2. Launch Extension Development Host (F5)
3. Trigger the functionality you want to debug
4. Debugger will pause at breakpoints

**Debug Configurations** (`.vscode/launch.json`):
- "Run Extension": Launches extension in debug mode
- "Extension Tests": Runs test suite

## Adding New Features

### Adding a New Command

1. **Define command in `package.json`**:
```json
{
  "command": "spec2cloud.newCommand",
  "title": "New Command",
  "icon": "$(icon-name)"
}
```

2. **Register command in `extension.ts`**:
```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('spec2cloud.newCommand', async () => {
    // Implementation
  })
);
```

3. **Add to menu if needed**:
```json
"menus": {
  "view/title": [
    {
      "command": "spec2cloud.newCommand",
      "when": "view == spec2cloud.browse",
      "group": "navigation"
    }
  ]
}
```

### Adding a New Configuration Option

1. **Add to `package.json` contributions**:
```json
"configuration": {
  "properties": {
    "spec2cloud.newSetting": {
      "type": "string",
      "default": "default-value",
      "description": "Description of the setting"
    }
  }
}
```

2. **Read in code**:
```typescript
const value = vscode.workspace.getConfiguration('spec2cloud').get('newSetting');
```

### Adding a New Tree View

1. **Define view in `package.json`**:
```json
"views": {
  "spec2cloud": [
    {
      "id": "spec2cloud.newView",
      "name": "New View"
    }
  ]
}
```

2. **Create provider class**:
```typescript
class NewViewProvider implements vscode.TreeDataProvider<TreeItem> {
  // Implementation
}
```

3. **Register in `extension.ts`**:
```typescript
const newViewProvider = new NewViewProvider();
vscode.window.registerTreeDataProvider('spec2cloud.newView', newViewProvider);
```

## API Integration

### GitHub API

**Base URL**: `https://api.github.com`

**Key Endpoints**:
- Get folder contents: `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`
- Get file: `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`

**Rate Limiting**:
- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour

**Authentication** (future enhancement):
```typescript
headers: {
  'Authorization': `token ${githubToken}`
}
```

### GitHub Raw Content

**Base URL**: `https://raw.githubusercontent.com`

**Format**: `/{owner}/{repo}/{branch}/{path}`

Used for:
- Fetching README.md files
- Fetching thumbnail images
- Downloading template files

## Error Handling

### Common Error Scenarios

1. **GitHub API Errors**:
   - 404: Repository or file not found
   - 403: Rate limit exceeded
   - Network errors

2. **Configuration Errors**:
   - Invalid GitHub URL
   - Missing repository
   - Invalid branch/folder

3. **File System Errors**:
   - No workspace folder open
   - Permission denied
   - Disk full

### Error Handling Pattern

```typescript
try {
  // Operation
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      vscode.window.showErrorMessage('Not found');
    } else if (error.response?.status === 403) {
      vscode.window.showErrorMessage('Rate limit exceeded');
    }
  } else {
    vscode.window.showErrorMessage(`Error: ${error}`);
  }
}
```

## Performance Considerations

### Caching
- Templates are cached after first fetch
- Cache is cleared on configuration change
- Use `clearCache()` to force refresh

### Lazy Loading
- Templates only fetched when needed
- Tree views load on-demand
- Files downloaded only when using template

### Progress Indicators
- Long operations show progress notifications
- User can see operation status
- No blocking UI operations

## Security Considerations

### GitHub Access
- Extension only reads public repositories by default
- No credentials stored
- Users can configure GitHub tokens for private repos

### File Operations
- Templates copied without overwriting existing files
- No arbitrary code execution
- File paths validated

### Content Safety
- README content sanitized
- No script execution from markdown
- URLs validated before opening

## Building for Production

### Package Extension

```bash
# Install vsce
npm install -g @vscode/vsce

# Package
vsce package

# Output: spec2cloud-toolkit-1.0.0.vsix
```

### Publish to Marketplace

```bash
# Create publisher account at https://marketplace.visualstudio.com

# Login
vsce login <publisher-name>

# Publish
vsce publish
```

## Future Enhancements

### Planned Features
- [ ] Template preview with syntax highlighting
- [ ] Template versioning
- [ ] Offline caching
- [ ] GitHub authentication
- [ ] Template favorites
- [ ] Search history
- [ ] Template comparison
- [ ] Custom template validation
- [ ] Template analytics
- [ ] Multi-repo support

### Technical Debt
- Add comprehensive unit tests
- Add integration tests
- Improve error messages
- Add telemetry (opt-in)
- Optimize large template downloads
- Add webhook support for template updates

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## Support

- GitHub Issues: Report bugs and request features
- Documentation: Check README and guides
- Community: Join discussions on GitHub

## License

MIT License - See [LICENSE](../LICENSE)
