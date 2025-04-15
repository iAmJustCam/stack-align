# Healer Implementation Guide

This guide outlines the best practices and patterns to follow when implementing new features or fixing issues in the Healer system.

## Core Principles

1. **Type Safety First**: Always use explicit types and avoid any usage that could lead to TypeScript errors.
2. **Validation Before Transformation**: Validate code before and after transformations to ensure correctness.
3. **Graceful Failure**: Handle errors gracefully and provide meaningful error messages.
4. **Incremental Improvement**: Focus on making one transformation work perfectly rather than multiple transformations working partially.
5. **Follow Our Own Rules**: The codebase should follow the same best practices that it enforces in user code.

## Type Safety Best Practices

### 1. Always Use Explicit Types

```typescript
// ❌ Avoid
const result = await someFunction();

// ✅ Better
const result: TransformationResult = await someFunction();
```

### 2. Use TypeScript Generics for Flexibility

```typescript
// ❌ Avoid
function processItems(items: any[]) {
  // ...
}

// ✅ Better
function processItems<T>(items: T[]): T[] {
  // ...
}
```

### 3. Avoid Type Assertions Unless Necessary

```typescript
// ❌ Avoid
const element = document.getElementById('app') as HTMLDivElement;

// ✅ Better
const element = document.getElementById('app');
if (element instanceof HTMLDivElement) {
  // Use element safely
}
```

## Code Structure

### 1. File Organization

- Place validators in the `/validators` directory
- Place healers in the `/healers` directory
- Place utilities in the `/utils` directory
- Follow kebab-case for file names

### 2. Component Structure

- Export components at the top level
- Use named exports over default exports
- Use React.FC type for functional components
- Destructure props in component parameters

### 3. Function Organization

- Sort functions by logical flow, not alphabetically
- Place helper functions after main functions
- Group related functions together

## Error Handling

### 1. Use Try/Catch Blocks

```typescript
try {
  // Risky operation
} catch (error) {
  console.error(`Error during transformation: ${error}`);
  // Graceful recovery
}
```

### 2. Provide Fallback Mechanisms

```typescript
function transformCode(sourceFile: SourceFile): boolean {
  try {
    // Primary transformation approach
    return true;
  } catch (error) {
    try {
      // Fallback approach
      return true;
    } catch (fallbackError) {
      console.error('All transformation approaches failed');
      return false;
    }
  }
}
```

### 3. Validate Results

```typescript
// After transformation
const validationIssues = validateTransformedCode(sourceFile, transformedContent);
if (validationIssues.length > 0) {
  // Handle validation failures
}
```

## Testing

### 1. Test Each Transformation Individually

Create separate test cases for each transformation type to isolate issues.

### 2. Test Edge Cases

Include tests for:
- Empty files
- Malformed code
- Already-transformed code
- Files with syntax errors

### 3. Validate Test Results

Don't just check if the function runs; validate that the output matches expectations:

```javascript
// Simple validation function
function validateTransformations(content) {
  const checks = [
    { name: 'Feature A', check: () => content.includes('expected text'), expected: true },
    // More checks...
  ];
  
  // Run and report on all checks
  checks.forEach(({ name, check, expected }) => {
    const passed = check() === expected;
    console.log(`${name}: ${passed ? 'PASS' : 'FAIL'}`);
  });
}
```

## Implementation Workflow

### 1. Analyze the Issue

- Understand the root cause
- Identify related components
- Check for similar issues that have been fixed

### 2. Create a Minimal Test Case

- Create a simple, focused test case
- Isolate the issue from other transformations

### 3. Fix the Core Issue

- Start with the simplest approach
- Validate the fix with your test case
- Add fallback mechanisms for edge cases

### 4. Add Validation

- Ensure the fix works with various input patterns
- Add validation to prevent regression

### 5. Document the Change

- Update relevant documentation
- Add code comments for complex logic
- Include examples if appropriate

## Transformation Best Practices

### 1. Use ts-morph API for Precise Changes

```typescript
// ❌ Avoid
const newText = oldText.replace(/pattern/g, replacement);

// ✅ Better
const declarations = sourceFile.getVariableDeclarations();
for (const declaration of declarations) {
  // Make precise changes using the AST
}
```

### 2. Handle Syntax Trees Carefully

- Remember that modifying one node can invalidate other node references
- Make changes from bottom-up in the tree where possible
- Save references to positions rather than nodes when making multiple changes

### 3. Validate Source Before Transformation

Check that the code is in a valid state before attempting transformations:

```typescript
if (!sourceFile.getFullText().includes('export default')) {
  // Skip this transformation
  return false;
}
```

By following these guidelines, we ensure that the Healer system is robust, maintainable, and follows the same high standards that it enforces in user code.