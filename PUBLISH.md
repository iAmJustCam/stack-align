# Publishing Guide for stack-align

This document outlines the process for publishing the stack-align CLI tool to npm.

## Prerequisites

1. You need an npm account with appropriate permissions to publish to the `stack-align` package
2. You need to be logged in to npm with `npm login`
3. Ensure you have the latest code from the GitHub repository

## Publishing Process

### 1. Prepare for Release

1. Update the version in package.json:
   ```bash
   # For a patch release (bug fixes)
   npm version patch

   # For a minor release (new features, backward compatible)
   npm version minor
   
   # For a major release (breaking changes)
   npm version major
   ```

   This will:
   - Update the version in package.json
   - Create a git tag
   - Format and stage the code

2. Push changes to GitHub:
   ```bash
   git push && git push --tags
   ```

### 2. Build and Publish

The package is configured to automatically build before publishing, but you can manually ensure everything is ready:

```bash
# Clean and build
npm run clean && npm run build

# Run tests
npm test
```

When ready to publish:

```bash
# Publish to npm
npm publish --access public
```

### 3. Verify the Published Package

After publishing, verify the package works correctly:

```bash
# Create a temporary directory
mkdir /tmp/test-stack-align && cd /tmp/test-stack-align

# Run the CLI directly using npx
npx stack-align --help

# Or install globally and test
npm install -g stack-align
stack-align --help
```

## Troubleshooting

If you encounter publishing issues:

1. Check that you're logged in to npm with the correct account
   ```bash
   npm whoami
   ```

2. Verify that the version you're trying to publish is unique
   ```bash
   npm view stack-align versions
   ```

3. Ensure the package.json and .npmignore files are correctly configured

4. If the package was published with errors, you can unpublish within 72 hours:
   ```bash
   npm unpublish stack-align@x.x.x
   ```

## Automated CI/CD (Future Enhancement)

In the future, we can set up GitHub Actions to automatically publish to npm when new releases are created in GitHub.