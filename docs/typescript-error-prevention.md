# TypeScript Error Prevention Guide

This document provides guidance on how to avoid common TypeScript errors we've encountered in this codebase.

## Import Statements

### ✅ DO THIS
```typescript
import * as path from 'path';
import * as fs from 'fs';
```

### ❌ NOT THAT
```typescript
import path from 'path';
import fs from 'fs';
```

The project configuration requires namespace imports for Node.js standard libraries.

## File System Access

### ✅ DO THIS
When using the custom `parseFile` utility:
```typescript
const content = await parseFile(filePath);
if (content.content.includes('some text')) {
  // Do something
}
```

### ❌ NOT THAT
```typescript
const content = await parseFile(filePath);
if (content.includes('some text')) {
  // Do something
}
```

Our `parseFile` utility returns an object with a `content` property that contains the actual file content.

## Custom Route Analysis

### ✅ DO THIS
When working with route analysis:
```typescript
const routeAnalysis = await analyzeRoutes(appDirPath);
const allRoutes = [
  ...routeAnalysis.appRoutes.map(route => ({ ...route, depth: route.path.split('/').length })),
  ...routeAnalysis.pageRoutes.map(route => ({ ...route, depth: route.path.split('/').length }))
];
const deepRoutes = allRoutes.filter(route => route.depth > 3);
```

### ❌ NOT THAT
```typescript
const routeAnalysis = await analyzeRoutes(appDirPath);
const deepRoutes = routeAnalysis.filter(route => route.depth > 3);
```

The TypeScript type definition for the result of `analyzeRoutes` doesn't include the `filter` method, even though the implementation adds it.

## Working with ts-morph

### ✅ DO THIS
```typescript
if (Node.isVariableDeclaration(node)) {
  // Do something with the node
}
```

### ❌ NOT THAT
```typescript
if (node.isVariableDeclaration()) {
  // This will cause TypeScript errors
}
```

Use the static methods from the `Node` namespace to check node types.

## Regular Expression Usage

### ✅ DO THIS
```typescript
const patternStr = typeof pattern === 'string' ? pattern : '';
const replacementStr = typeof replacement === 'string' ? replacement : '';
const regex = new RegExp(patternStr, options);
```

### ❌ NOT THAT
```typescript
const regex = new RegExp(pattern, options);
```

Always add type checks when working with parameters that might be undefined or of a different type.

## Type Guards

### ✅ DO THIS
```typescript
const componentName = context.componentName || '';
const variableDeclaration = sourceFile.getVariableDeclaration(componentName);
```

### ❌ NOT THAT
```typescript
const variableDeclaration = sourceFile.getVariableDeclaration(context.componentName);
```

Use nullish coalescing or default values for potentially undefined properties.

## File Paths in Array Operations

### ✅ DO THIS
```typescript
const tsxFiles = allFiles.filter(file => !file.includes('.test.') && !file.includes('.spec.'));
```

This is correct because `file` is a string (file path) in this context.

## Reading Files with fs.promises

### ✅ DO THIS
When directly reading files with `fs.promises`:
```typescript
const content = await fs.promises.readFile(filePath, 'utf8');
if (content.includes('some text')) {
  // Do something
}
```

This is correct because `fs.promises.readFile` returns a string directly.

## Modifying Objects with Object.assign

### ✅ DO THIS
```typescript
const contentWithIncludes = Object.assign(content, { includes }) as string & { includes: (text: string) => boolean };
```

### ❌ NOT THAT
```typescript
const contentWithIncludes = { ...content, includes };
```

Use `Object.assign` with proper type assertions when extending objects with methods.

## Summary of Fixed Files

- `/src/healers/component-healer.ts`
- `/src/utils/ast.ts`
- `/src/utils/fs.ts`
- `/src/validators/nextjs15-validator.ts`
- `/src/validators/vitest-validator.ts`
- `/src/validators/react19-validator.ts`
- `/src/validators/typescript5-validator.ts`
- `/src/validators/tailwindv4-validator.ts`