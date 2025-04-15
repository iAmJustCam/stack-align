# stack-align Release Checklist

Use this checklist before each release to ensure everything is ready for publication.

## Pre-Release Checks

### Documentation
- [ ] README.md is up-to-date with the latest features
- [ ] SETUP.md has current installation instructions
- [ ] Command documentation reflects any changes to CLI options
- [ ] Example code in docs is current and works

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Manual testing of major features complete

### Version Control
- [ ] All changes are committed to the main branch
- [ ] Git status is clean (no uncommitted changes)
- [ ] Version number in package.json is updated appropriately 
      (patch for bugfixes, minor for features, major for breaking changes)

## Release Process

### Versioning
- [ ] Run `npm version patch|minor|major` to update the version
- [ ] Push to GitHub: `git push && git push --tags`

### Publishing
- [ ] Ensure you're logged in to npm: `npm whoami`
- [ ] Publish to npm: `npm publish --access public`

### Post-Release Verification
- [ ] Install package freshly: `npm install -g stack-align`
- [ ] Test basic functionality: `stack-align --help`
- [ ] Test primary commands:
  - [ ] `stack-align check`
  - [ ] `stack-align align --dry-run`
  - [ ] `stack-align report`

### Announcement (if appropriate)
- [ ] Create release notes on GitHub
- [ ] Notify users through appropriate channels

## Critical Issues to Watch For

- [ ] Ensure CLI can find and execute the main entry point
- [ ] Verify the bin script is executable after installation
- [ ] Check that dependencies are correctly bundled or listed
- [ ] Verify the CLI works properly on both macOS and Linux