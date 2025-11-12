# MCP Tool Configuration

The Spec2Cloud Toolkit extension provides an MCP (Model Context Protocol) tool that can be used by AI assistants to search and select templates.

## Tool: spec2cloud-select-template

This tool allows AI assistants to search and filter Spec2Cloud templates programmatically.

### Parameters

- `searchTerm` (optional): Search term to filter templates by title, description, tags, services, languages, or frameworks
- `category` (optional): Filter by category (defaults to "All")
- `industry` (optional): Filter by industry (defaults to "All")

### Usage Example

To use this tool, AI assistants can invoke:

```json
{
  "command": "spec2cloud.mcp.selectTemplate",
  "arguments": {
    "searchTerm": "cosmos db",
    "category": "Data",
    "industry": "All"
  }
}
```

### Response Format

The tool returns:

```json
{
  "success": true,
  "count": 5,
  "templates": [
    {
      "name": "template-folder-name",
      "title": "Template Title",
      "description": "Template description",
      "category": "Category Name",
      "industry": "Industry Name",
      "version": "1.0.0",
      "lastCommitDate": "2025-01-15"
    }
  ]
}
```

### Behavior

When invoked, the tool will:
1. Filter templates based on the provided criteria
2. Open the Template Gallery in VS Code with the search term pre-filled
3. Return the list of matching templates

This allows AI assistants to help users discover and select appropriate templates for their projects.
