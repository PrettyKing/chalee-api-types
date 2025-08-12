# Chalee API Types

A powerful CLI tool for generating TypeScript types from API schemas with support for OpenAPI, JSON Schema, and custom formats.

## Features

- 🚀 Generate TypeScript types from various schema formats
- 📝 Support for OpenAPI/Swagger and JSON Schema
- 🔄 Sync types from remote API endpoints
- ✅ Schema validation with detailed error reporting
- 🎯 Project initialization with templates
- 🛠️ Customizable output formats (TypeScript, JavaScript, JSON)
- 📦 Easy integration with existing projects

## Installation

```bash
# Install from your private registry
npm install chalee-api-types --registry http://8.134.93.68:4873/

# Or install globally
npm install -g chalee-api-types --registry http://8.134.93.68:4873/
```

## Quick Start

```bash
# Initialize a new project
chalee-types init

# Generate types from schema
chalee-types generate --input ./schemas/api.json --output ./types

# Validate a schema file
chalee-types validate ./schemas/api.json

# Sync types from remote API
chalee-types sync --url https://api.example.com/openapi.json --output ./types
```

## Development

Coming soon - full project structure and source code will be added.

## License

MIT