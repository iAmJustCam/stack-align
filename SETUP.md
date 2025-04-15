# Stack Align CLI Setup

This document describes how to set up and use the Stack Align CLI tool.

## Building the Project

To build the project, run:

```bash
npm run build
```

This will compile the TypeScript source files into JavaScript in the `dist` directory.

## Using the CLI

After building the project, you can use the CLI in several ways:

### As a Local Dependency

1. Install in your project:
   ```bash
   npm install --save-dev stack-align
   ```

2. Use with npx:
   ```bash
   npx stack-align check
   npx stack-align align --dry-run
   ```

### As a Global Command

1. Install globally:
   ```bash
   npm install -g stack-align
   ```

2. Use directly:
   ```bash
   stack-align check
   stack-align align --max-fix 20
   ```

### For Development

1. Link the package to your global bin:
   ```bash
   npm run link-dev
   ```

2. Use the linked command:
   ```bash
   stack-align check
   ```

3. Unlink when done:
   ```bash
   npm run unlink-dev
   ```

## Commands and Aliases

| Original Command | Aliases | Description |
|------------------|---------|-------------|
| `analyze` | `check` | Analyze project code |
| `heal` | `align` | Fix detected issues |
| `test:generate` | `generate-tests` | Generate tests for components |
| `analyze --save file.html --report html` | `report` | Save analysis to file |

## Troubleshooting

If you encounter issues running the CLI:

1. Make sure the project is built:
   ```bash
   npm run build
   ```

2. Check that the bin file is executable:
   ```bash
   chmod +x bin/cli.js
   ```

3. For development, try running the TypeScript source directly:
   ```bash
   npx ts-node src/cli-entry.ts
   ```