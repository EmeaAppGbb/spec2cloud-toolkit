# Example Template Repository Structure

This document shows how to structure your GitHub repository for use with Spec2Cloud Toolkit.

## Repository Structure

```
your-templates-repo/
├── README.md                    # Repo documentation
├── .github/                     # Optional: Shared workflows
│   └── workflows/
│       └── ci.yml
├── templates/                   # Templates folder (configurable)
│   ├── ai-chatbot-template/
│   │   ├── README.md           # Required: Template documentation
│   │   ├── thumbnail.png       # Optional: Template thumbnail
│   │   ├── src/
│   │   │   └── app.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   │
│   ├── web-app-template/
│   │   ├── README.md
│   │   ├── thumbnail.png
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.html
│   │   │   └── app.js
│   │   └── .gitignore
│   │
│   └── data-pipeline-template/
│       ├── README.md
│       ├── custom-thumbnail.jpg  # Custom thumbnail
│       ├── config/
│       ├── scripts/
│       └── data/
└── docs/                        # Optional: Additional documentation
    └── template-guide.md
```

## Template README.md Format

Each template MUST have a `README.md` file with frontmatter:

### Example 1: Full Metadata

```markdown
---
title: AI Chatbot Template
description: A production-ready chatbot template with Azure OpenAI integration
thumbnail: thumbnail.png
version: 2.1.0
category: AI Apps & Agents
industry: Financial Services
---

# AI Chatbot Template

This template provides a complete chatbot solution...

## Features

- Azure OpenAI integration
- Conversation history
- Multi-turn dialogue
- Authentication

## Getting Started

1. Copy the template to your workspace
2. Install dependencies: `pip install -r requirements.txt`
3. Configure your Azure OpenAI credentials
4. Run the app: `python src/app.py`

## Configuration

...
```

### Example 2: Minimal Metadata

```markdown
---
category: Data Centric Apps
industry: Healthcare & Life Sciences
---

# Data Pipeline Template

A robust ETL pipeline for healthcare data processing...
```

If metadata is missing, the extension will:
- Use the `# Heading 1` as the title
- Use the first paragraph after the heading as description
- Look for `thumbnail.png` in the template folder
- Default version to "1.0.0"
- Show "Uncategorized" for missing category
- Show "General" for missing industry

## Thumbnail Guidelines

### Supported Formats
- PNG (recommended)
- JPG/JPEG
- SVG

### Recommended Dimensions
- 200x150 pixels
- 4:3 aspect ratio
- Max file size: 500KB

### Naming
- Default: `thumbnail.png`
- Custom: Specify in frontmatter `thumbnail: custom-name.jpg`
- Fallback: If not found, extension uses default thumbnail

## Available Categories

```
- AI Apps & Agents
- App Modernization
- Data Centric Apps
```

You can customize categories in the extension's `config/spec2cloud.config.json`.

## Available Industries

```
- Financial Services
- Healthcare & Life Sciences
- Manufacturing
- Retail & Consumer Goods
- Government & Public Sector
- Education
- Energy & Resources
- Telco & Media
- Mobility & Automotive
```

You can customize industries in the extension's `config/spec2cloud.config.json`.

## Best Practices

### 1. Template Organization
- Keep templates focused and single-purpose
- Include all necessary files and dependencies
- Provide clear documentation
- Add examples and sample data

### 2. README.md
- Write clear, concise descriptions
- Include setup instructions
- Document prerequisites
- Add troubleshooting section
- List all configuration options

### 3. Thumbnails
- Use descriptive, professional images
- Keep file sizes small
- Use consistent styling across templates
- Make thumbnails easily recognizable

### 4. Version Control
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Document changes in template README
- Update version in frontmatter when making changes

### 5. .github Folder
- Use for shared GitHub Actions workflows
- Include reusable CI/CD configurations
- Document workflow requirements
- The extension will copy this folder when using a template

## Example Template Layouts

### Python Application
```
python-app-template/
├── README.md
├── thumbnail.png
├── requirements.txt
├── setup.py
├── src/
│   ├── __init__.py
│   └── main.py
├── tests/
│   └── test_main.py
├── .env.example
└── .gitignore
```

### Node.js Application
```
nodejs-app-template/
├── README.md
├── thumbnail.png
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
├── tests/
├── .env.example
└── .gitignore
```

### Azure Infrastructure
```
azure-infra-template/
├── README.md
├── thumbnail.png
├── main.bicep
├── parameters.json
├── modules/
│   ├── storage.bicep
│   └── compute.bicep
└── scripts/
    └── deploy.sh
```

## Testing Your Templates

Before publishing templates:

1. Test the README.md frontmatter parsing
2. Verify thumbnail displays correctly
3. Ensure all files are included
4. Test template in a clean workspace
5. Verify .github folder copies correctly
6. Check for any hardcoded paths or credentials

## Sample Repository

You can use this structure as a template for your own repository:

```bash
# Create a new repository
mkdir my-spec-templates
cd my-spec-templates
git init

# Create the structure
mkdir -p templates/sample-template
mkdir -p .github/workflows

# Create a sample template
cat > templates/sample-template/README.md << 'EOF'
---
title: Sample Template
description: A sample template to get started
version: 1.0.0
category: AI Apps & Agents
industry: General
---

# Sample Template

This is a sample template.
EOF

# Commit and push
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/my-spec-templates.git
git push -u origin main
```

Then configure the extension:
```json
{
  "spec2cloud.githubRepo": "https://github.com/your-org/my-spec-templates",
  "spec2cloud.templatesBranch": "main",
  "spec2cloud.templatesFolder": "templates"
}
```

## Support

For issues or questions:
- Check the extension README
- Visit the GitHub repository
- Report issues on GitHub Issues
