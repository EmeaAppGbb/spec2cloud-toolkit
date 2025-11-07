# Testing Guide for Spec2Cloud Toolkit

## Quick Start Testing

### Step 1: Launch Extension Development Host

1. Open this project in VS Code
2. Press **F5** (or Run → Start Debugging)
3. A new VS Code window opens with "[Extension Development Host]" in the title
4. Your extension is now running in that window

### Step 2: Configure a Test Repository

In the Extension Development Host window, configure a GitHub repository:

**Option A: Use a Test Repository**

Open Settings (Ctrl+,) and add:
```json
{
  "spec2cloud.githubRepo": "https://github.com/Azure-Samples/azure-quickstart-templates",
  "spec2cloud.templatesBranch": "master",
  "spec2cloud.templatesFolder": "quickstarts"
}
```

**Option B: Create Your Own Test Repository**

1. Create a GitHub repo with this structure:
```
my-test-templates/
└── templates/
    └── sample-template/
        ├── README.md
        └── thumbnail.png
```

2. Add this README.md:
```markdown
---
title: Sample Template
description: A test template for Spec2Cloud
version: 1.0.0
category: AI Apps & Agents
industry: Financial Services
---

# Sample Template

This is a test template.
```

3. Configure in Extension Development Host:
```json
{
  "spec2cloud.githubRepo": "https://github.com/YOUR-USERNAME/my-test-templates",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "templates"
}
```

### Step 3: Test Each Feature

#### ✅ Browse View
1. Click the Spec2Cloud icon in Activity Bar
2. In the Browse panel, click the **Search** button (🔍)
3. Enter a search term (or leave blank)
4. Select a category
5. Select an industry
6. Verify templates appear in Templates panel

#### ✅ Templates View
1. Check that search results appear
2. Click the **Toggle View** button (📋) - verify gallery ↔ list view switch
3. For each template card:
   - Click **View** (👁️) - should open Simple Browser
   - Click **View on GitHub** (🔗) - should open external browser
   - Click **Use** (⬇️) - should copy to workspace (requires open folder)

#### ✅ Resources View
1. Verify resource items are displayed
2. Click on a resource - should open URL in external browser

#### ✅ Refresh
1. Click the Refresh button in Templates view
2. Verify templates reload

### Step 4: Test Template Copying

1. **Open a workspace folder** in Extension Development Host:
   - File → Open Folder
   - Create/select a test folder

2. **Search for a template**

3. **Click "Use" button**

4. **Verify**:
   - Progress notification shows
   - Files are copied to your workspace
   - "Template has been added" message appears
   - Check your workspace for the new files

5. **Test no-overwrite**:
   - Click "Use" again on the same template
   - Verify existing files are NOT overwritten

### Step 5: Test MCP Tool (Advanced)

In Extension Development Host, open the Developer Console:
- Help → Toggle Developer Tools
- Go to Console tab

Execute:
```javascript
vscode.commands.executeCommand('spec2cloud.mcp.selectTemplate', {
  name: 'spec2cloud-select-template',
  parameters: {
    searchTerm: 'test',
    category: 'All',
    industry: 'All'
  }
}).then(result => console.log(result));
```

## Testing Checklist

### Basic Functionality
- [ ] Extension activates without errors
- [ ] Spec2Cloud icon appears in Activity Bar
- [ ] All three views (Browse, Templates, Resources) are visible
- [ ] Welcome message appears on first launch (if no repo configured)

### Configuration
- [ ] Can set GitHub repo URL in settings
- [ ] Can set custom branch
- [ ] Can set custom templates folder
- [ ] Configuration changes trigger reload

### Search & Browse
- [ ] Search dialog opens
- [ ] Can enter search term
- [ ] Category filter works
- [ ] Industry filter works
- [ ] Search returns results
- [ ] Empty search shows all templates
- [ ] No results message when nothing matches

### Templates View
- [ ] Gallery view displays correctly
- [ ] List view displays correctly
- [ ] Toggle between views works
- [ ] Template metadata displays (title, description, category, industry, version)
- [ ] Text truncates to fit
- [ ] Tooltips show full information

### Template Actions
- [ ] View button opens Simple Browser
- [ ] View on GitHub opens external browser
- [ ] Use button requires workspace folder
- [ ] Use button shows progress
- [ ] Template files are copied
- [ ] .github folder is copied (if exists)
- [ ] Existing files are NOT overwritten
- [ ] Success message displays

### Resources
- [ ] Resources load from config
- [ ] Icons display correctly
- [ ] Clicking opens external browser
- [ ] Custom resources can be added to config

### Error Handling
- [ ] Invalid GitHub URL shows error
- [ ] 404 repository shows helpful error
- [ ] Network errors show error message
- [ ] No workspace folder shows error when using template
- [ ] Rate limit error shows helpful message

### Performance
- [ ] Templates load in reasonable time
- [ ] Search is responsive
- [ ] No UI freezing during operations
- [ ] Progress indicators show for long operations

### MCP Tool
- [ ] Tool command exists
- [ ] Parameters work correctly
- [ ] Results update Templates view
- [ ] View focuses on results

## Debug Testing

### Using Breakpoints

1. Set breakpoints in TypeScript files (e.g., `src/extension.ts`)
2. Press F5
3. Trigger the functionality
4. Debugger pauses at breakpoint
5. Inspect variables, step through code

### Using Console Logging

Add to your code:
```typescript
console.log('Debug message:', variable);
```

View output:
- Extension Development Host
- Help → Toggle Developer Tools
- Console tab

### Using Output Channel

In Extension Development Host:
- View → Output
- Select "Log (Extension Host)"

## Testing with Different Scenarios

### Scenario 1: Public Repository
```json
{
  "spec2cloud.githubRepo": "https://github.com/microsoft/vscode-extension-samples",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "helloworld-sample"
}
```

### Scenario 2: Large Repository
Test performance with a repo that has many templates

### Scenario 3: Invalid Configuration
Test error handling:
- Wrong URL
- Non-existent branch
- Missing folder

### Scenario 4: Network Issues
Test while offline or with poor connection

## Automated Testing (Future)

Currently manual testing, but you can add:
```bash
npm test  # (Not implemented yet)
```

## Watch Mode for Development

For continuous development:

1. Open Terminal in VS Code
2. Run: `npm run watch`
3. Code auto-compiles on changes
4. Reload Extension Development Host (Ctrl+R / Cmd+R)

## Common Issues & Solutions

### Extension Doesn't Activate
- Check Output → Log (Extension Host) for errors
- Verify package.json activationEvents

### Templates Don't Load
- Verify GitHub repo URL is correct
- Check branch name exists
- Confirm templates folder exists
- Check Developer Console for API errors

### "Use" Button Doesn't Work
- Ensure workspace folder is open
- Check file permissions
- View Output channel for errors

### Simple Browser Doesn't Open
- Verify VS Code version is 1.85.0+
- Check command is correct

## Production Testing

Before publishing:

1. **Package the extension**:
   ```powershell
   npm install -g @vscode/vsce
   vsce package
   ```

2. **Install the VSIX**:
   ```powershell
   code --install-extension spec2cloud-toolkit-1.0.0.vsix
   ```

3. **Test in fresh VS Code window** (not Extension Development Host)

4. **Test with multiple users/machines**

## Performance Testing

Monitor:
- GitHub API rate limits (60/hour unauthenticated)
- Memory usage
- Response times
- Large template downloads

## Reporting Issues

If you find bugs:
1. Note steps to reproduce
2. Check Output/Console for errors
3. Note VS Code version
4. Note extension version
5. Document expected vs actual behavior

---

**Next Steps**: 
1. Press F5 to start testing
2. Follow the checklist above
3. Report any issues you find
