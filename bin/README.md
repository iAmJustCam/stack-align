# Stack Align CLI Binary

This directory contains the CLI executable entry point for the Stack Align tool.

## Files

- `cli.js`: The main entry point for the CLI tool. This file is referenced in package.json's `bin` field.

## Usage

When Stack Align is installed, this script is symlinked to the user's global bin directory or 
the project's node_modules/.bin directory, allowing it to be executed directly from the command line:

```bash
stack-align check
stack-align align --dry-run
```

Or when using npx:

```bash
npx stack-align check
npx stack-align align --dry-run
```

## Development

During development, you can use `npm link` to symlink this script to your global bin directory:

```bash
npm run link-dev
```

To unlink:

```bash
npm run unlink-dev
```