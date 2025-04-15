# Stack Align

[![npm version](https://img.shields.io/npm/v/stack-align.svg)](https://www.npmjs.com/package/stack-align)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive validation and healing system for modern Next.js applications, ensuring best practices across React 19, Next.js 15, TypeScript 5, and Tailwind v4, with automatic test generation.

## Features

- 🔍 **Top-down analysis** from project structure to individual components
- 🧰 **Automatic healing** of detected issues with safety limits
- 🧪 **Test generation** with Vitest for comprehensive coverage
- 🏗️ **Strict architectural validation** for maintainable codebases
- 🧩 **Framework-specific validations** for React, Next.js, TypeScript, and Tailwind
- 📊 **Detailed reporting** with rule coverage summary
- 🚫 **File exclusion patterns** with `.alignignore` support
- 🔄 **CI/CD integration** with GitHub Actions templates

## Getting Started

```bash
# Install locally in your project
npm install --save-dev stack-align

# Install globally (optional)
npm install -g stack-align

# Run as a local dependency
npx stack-align check
npx stack-align align --dry-run

# Run as a global command (if installed globally)
stack-align check
stack-align align --max-fix 20

# Run directly with npx (without installing)
npx stack-align check
npx stack-align align --dry-run
```

### CLI Command Aliases

| Original Command | Aliases | Description |
|------------------|---------|-------------|
| `analyze` | `check` | Analyze project code |
| `heal` | `align` | Fix detected issues |
| `test:generate` | `generate-tests` | Generate tests for components |
| `analyze --save file.html --report html` | `report` | Save analysis to file |

### Ignoring Files and Directories

Create a `.alignignore` file in your project root to exclude files from validation:

```
# Comments start with #
**/generated/**
**/.vscode/**
**/legacy-code/**
temp.ts
```

## Core Healers

The system includes multiple healers that fix specific issues:

- **Component Healer**: Transforms React components to follow best practices
- **Test Generation Engine**: Creates comprehensive tests for components and hooks
- **TypeScript Best Practices**: Fixes common TypeScript errors and anti-patterns
- **Advanced Validation System**: Detects and fixes complex patterns across frameworks

### Component Healing Features

✅ **File naming convention**: Convert to kebab-case
✅ **Component naming**: Convert to PascalCase
✅ **useEffect dependency arrays**: Add proper dependencies
✅ **"use client" directive**: Add when needed for client components
✅ **Named exports**: Convert default exports to named exports
✅ **JSX-aware validation**: Smart detection of valid JSX patterns

### Coming Soon

We're working on adding comprehensive validations for:

- **Next.js 15**: Metadata API, Async Layout APIs, Dynamic Route Segments
- **React 19**: String Refs, FindDOMNode, Use Hook Conditional Usage
- **Tailwind CSS v4**: Logical Properties, Custom Plugin Migration, Deprecated Utility Detection
- **TypeScript 5**: VerbatimModuleSyntax, Satisfies Operator, Type Imports

### Example Transformation

Original component with issues:
```jsx
function userCard(props) {
  useEffect(() => {
    fetch(`/api/users/${props.userId}`)
      .then(res => res.json())
      .then(data => setUserData(data))
  }) // Missing dependency array

  return <div style={{padding: '16px'}}>{props.name}</div>
}

export default userCard
```

Transformed component:
```tsx
"use client";

export function UserCard({ userId, name }: UserCardProps) {
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUserData(data))
  }, [userId]) // Fixed dependency array

  return <div className="p-4">{name}</div>
}
```

## Documentation

For complete documentation, see the docs directory:

- [System Architecture](docs/system-architecture.md)
- [Implementation Guide](docs/guides/healer-implementation-guide.md)
- [Component Transformation Examples](docs/examples/component-transformation-example.md)
- [TypeScript Error Prevention](docs/typescript-error-prevention.md)
- [Project Roadmap](project-roadmap.md)

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/tech-stack-alignment-system.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Test specific healer
node test-direct-healer.js
```

## Contributing

Contributions are welcome! Please see our [Implementation Guide](docs/guides/healer-implementation-guide.md) for best practices when adding new features or fixing issues.

## License

MIT