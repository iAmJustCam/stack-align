import * as path from 'path';
import type { ComponentContext, TestGenerationOptions, TestGenerationResult, ProjectContext } from '../types';
import { parseComponent, parseTypeScript, guessTypeFromName } from '../utils/ast';
import { createDirectory, fileExists, readFile, writeFile, getFilesWithExtension } from '../utils/fs';
import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';

/**
 * Result type for test generation operations
 */
export interface TestOperation {
  type: string;
  filePath?: string;
  testPath?: string;
  entityKind?: 'component' | 'hook' | 'utility' | 'unknown';
  entityName?: string;
  success: boolean;
  description: string;
}

/**
 * Result type for test generation process
 */
export interface TestGenerationOutput {
  operations: TestOperation[];
  success: boolean;
  timestamp: Date;
  summary: {
    total: number;
    componentTests: number;
    hookTests: number;
    utilityTests: number;
    created: number;
    skipped: number;
  };
}

/**
 * Identifies the kind of exportable entity in a source file
 * This is a key part of context-aware test generation
 */
export function getExportableEntityKind(
  sourceFile: SourceFile
): { kind: 'component' | 'hook' | 'utility' | 'unknown'; name: string | null } {
  // Look for exports first
  const exportDeclarations = sourceFile
    .getDescendantsOfKind(SyntaxKind.ExportDeclaration)
    .concat(sourceFile.getDescendantsOfKind(SyntaxKind.ExportAssignment));
  
  const exportedElements = sourceFile.getExportedDeclarations();
  let primaryExportName: string | null = null;

  // First try to find a component export
  for (const [name, declarations] of exportedElements) {
    for (const declaration of declarations) {
      // Check for React.FC or JSX in the declaration
      const declarationText = declaration.getText();
      if (declarationText.includes('React.FC') || 
          declarationText.includes('<div') || 
          declarationText.includes('JSX') || 
          declarationText.includes('return (')) {
        primaryExportName = name;
        return { kind: 'component', name: primaryExportName };
      }
    }
  }

  // Check for hook exports (functions starting with "use")
  for (const [name, declarations] of exportedElements) {
    if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
      primaryExportName = name;
      return { kind: 'hook', name: primaryExportName };
    }
    
    // Also check each declaration's text
    for (const declaration of declarations) {
      const declarationText = declaration.getText();
      if ((declarationText.includes('function use') || declarationText.includes('const use')) && 
          !declarationText.includes('useCallback') && 
          !declarationText.includes('useEffect') && 
          !declarationText.includes('useState')) {
        primaryExportName = name;
        return { kind: 'hook', name };
      }
    }
  }

  // If it's not a component or hook, check for utility functions
  for (const [name, declarations] of exportedElements) {
    for (const declaration of declarations) {
      // Look for function declarations or const declarations with functions
      if (Node.isFunctionDeclaration(declaration) || 
          (Node.isVariableDeclaration(declaration) && 
           declaration.getInitializer()?.getKind() === SyntaxKind.ArrowFunction)) {
        primaryExportName = name;
        return { kind: 'utility', name: primaryExportName };
      }
    }
  }

  return { kind: 'unknown', name: primaryExportName };
}

/**
 * Generates comprehensive test files for components and hooks
 *
 * @param context Project context
 * @param options Test generation options
 */
export async function generateTests(
  context: ProjectContext,
  options: TestGenerationOptions = {}
): Promise<TestGenerationOutput> {
  console.log('Generating tests...');

  const operations: TestOperation[] = [];
  const summary = {
    total: 0,
    componentTests: 0,
    hookTests: 0,
    utilityTests: 0,
    created: 0,
    skipped: 0
  };

  // Generate component tests
  if (!options.filter || options.filter === 'components') {
    const componentResults = await generateComponentTests(context, options);
    operations.push(...componentResults);
    
    summary.componentTests = componentResults.length;
    summary.created += componentResults.filter(op => op.success).length;
    summary.skipped += componentResults.filter(op => !op.success).length;
  }

  // Generate hook tests
  if (!options.filter || options.filter === 'hooks') {
    const hookResults = await generateHookTests(context, options);
    operations.push(...hookResults);
    
    summary.hookTests = hookResults.length;
    summary.created += hookResults.filter(op => op.success).length;
    summary.skipped += hookResults.filter(op => !op.success).length;
  }

  // Generate utility tests
  if (!options.filter || options.filter === 'utils') {
    const utilResults = await generateUtilityTests(context, options);
    operations.push(...utilResults);
    
    summary.utilityTests = utilResults.length;
    summary.created += utilResults.filter(op => op.success).length;
    summary.skipped += utilResults.filter(op => !op.success).length;
  }

  summary.total = operations.length;

  return {
    operations,
    success: operations.some(op => op.success),
    timestamp: new Date(),
    summary
  };
}

/**
 * Generates tests for all components
 */
export async function generateComponentTests(
  context: ProjectContext,
  options: TestGenerationOptions = {}
): Promise<TestOperation[]> {
  const operations: TestOperation[] = [];
  const dryRun = options.dryRun || false;

  // Get all component files
  const componentsDir = path.join(context.rootDir, 'src', 'components');
  const componentExists = await fileExists(componentsDir);

  if (!componentExists) {
    console.log('No components directory found');
    return operations;
  }

  console.log('Generating tests for components...');

  // Get component files (excluding tests and index files)
  const allFiles = await getFilesWithExtension(componentsDir, ['.tsx', '.jsx', '.js'], true);
  
  // Filter out test files, story files, and index files
  const componentFiles = allFiles.filter(file => {
    const filename = path.basename(file);
    return !filename.includes('.test.') && 
           !filename.includes('.spec.') && 
           !filename.includes('.stories.') && 
           filename !== 'index.tsx' && 
           filename !== 'index.jsx' && 
           filename !== 'index.js' &&
           !file.includes('__tests__');
  });

  console.log(`Found ${componentFiles.length} component files to process`);

  // For specific component filtering
  if (options.componentName) {
    const filteredComponents = componentFiles.filter(file => 
      path.basename(file, path.extname(file)).includes(options.componentName!)
    );
    
    if (filteredComponents.length > 0) {
      console.log(`Filtering to ${filteredComponents.length} components matching "${options.componentName}"`);
      componentFiles.length = 0;
      componentFiles.push(...filteredComponents);
    } else {
      console.log(`No components found matching "${options.componentName}"`);
    }
  }

  // For each component, generate a test file
  for (const componentFile of componentFiles) {
    try {
      // Parse the component
      const componentContext = await parseComponent(componentFile);
      
      // Skip if not a component
      if (!componentContext.isComponent) {
        operations.push({
          type: 'skip',
          filePath: componentFile,
          entityKind: 'unknown',
          success: false,
          description: 'Not a React component'
        });
        continue;
      }
      
      // Determine test file path (either in __tests__ directory or same directory)
      const parsedPath = path.parse(componentFile);
      let testDir: string;
      let testPath: string;
      
      // Check if we should use __tests__ directory
      const testsDir = path.join(parsedPath.dir, '__tests__');
      const testsDirExists = await fileExists(testsDir);
      
      if (testsDirExists) {
        testDir = testsDir;
        testPath = path.join(testDir, `${parsedPath.name}.test${parsedPath.ext}`);
      } else {
        testDir = parsedPath.dir;
        testPath = path.join(testDir, `${parsedPath.name}.test${parsedPath.ext}`);
      }
      
      // Check if test already exists
      const testExists = await fileExists(testPath);
      if (testExists && !options.overwrite) {
        operations.push({
          type: 'skip',
          filePath: componentFile,
          testPath,
          entityKind: 'component',
          entityName: componentContext.componentName,
          success: false,
          description: 'Test file already exists'
        });
        continue;
      }
      
      // Create test directory if it doesn't exist
      if (!await fileExists(testDir) && !dryRun) {
        await createDirectory(testDir);
      }
      
      // Generate test content
      const testContent = await generateComponentTestContent(componentContext, componentFile);
      
      // Write test file
      if (!dryRun) {
        await writeFile(testPath, testContent);
        
        operations.push({
          type: 'create',
          filePath: componentFile,
          testPath,
          entityKind: 'component',
          entityName: componentContext.componentName,
          success: true,
          description: `Created component test for ${componentContext.componentName}`
        });
      } else {
        operations.push({
          type: 'dryrun',
          filePath: componentFile,
          testPath,
          entityKind: 'component',
          entityName: componentContext.componentName,
          success: true,
          description: `Would create component test for ${componentContext.componentName}`
        });
      }
    } catch (error) {
      console.error(`Error generating test for ${componentFile}:`, error);
      operations.push({
        type: 'error',
        filePath: componentFile,
        success: false,
        description: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  return operations;
}

/**
 * Generates test for a specific component
 *
 * @param componentPath Path to the component file
 * @param componentContext Component metadata
 * @param dryRun Whether to actually create the file
 */
export async function generateTestForComponent(
  componentPath: string,
  componentContext: ComponentContext,
  dryRun: boolean = false
): Promise<TestGenerationResult> {
  // Determine test file path
  const parsedPath = path.parse(componentPath);
  const testDir = path.join(parsedPath.dir, '__tests__');
  const testPath = path.join(testDir, `${parsedPath.name}.test.tsx`);

  console.log(`Generating test for ${parsedPath.name}...`);

  // Check if test already exists
  const testExists = await fileExists(testPath);

  if (testExists) {
    console.log(`Test already exists for ${parsedPath.name}`);
    return {
      testPath,
      componentPath,
      success: false,
      message: 'Test file already exists',
      coverage: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    };
  }

  // Create test directory if it doesn't exist
  if (!await fileExists(testDir) && !dryRun) {
    await createDirectory(testDir);
  }

  // Generate test content based on component type and props
  const testContent = await generateTestContent(componentContext, componentPath);

  // Write test file
  if (!dryRun) {
    await writeFile(testPath, testContent);
  }

  return {
    testPath,
    componentPath,
    success: true,
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  };
}

/**
 * Generates appropriate test content for a component
 */
async function generateTestContent(context: ComponentContext, componentPath: string): Promise<string> {
  // Get component content
  const componentContent = context.content || await readFile(componentPath);

  // Parse the component again if we don't have context data
  if (!context.componentName) {
    context = await parseComponent(componentPath, componentContent);
  }

  const { 
    componentName, 
    props = [], 
    hasChildren, 
    events = [] as string[], // Type assertion to handle unknown type
    isPage, 
    isServerComponent 
  } = context;

  // Determine if we need to mock React's use hook
  const needsUseMock = componentContent.includes(' use(') || componentContent.includes('.then') ||
                      componentContent.includes('fetch(') || componentContent.includes('axios.');

  // Determine component type for different testing approaches
  // Check if component is interactive based on events or event handlers in the code
  const hasEventHandlers = componentContent.includes('onClick') || 
                         componentContent.includes('onChange') || 
                         componentContent.includes('onSubmit');
  // Check if events is an array before accessing length
  const hasEvents = Array.isArray(events) && events.length > 0;
  const isInteractive = hasEvents || hasEventHandlers;

  const hasFetch = componentContent.includes('fetch(') || componentContent.includes('axios.');

  // Generate imports section
  const imports = [
    "import { describe, it, expect, vi } from 'vitest';",
    "import { render, screen } from '@testing-library/react';",
  ];

  // Add user events if component has interactive elements
  if (isInteractive) {
    imports.push("import userEvent from '@testing-library/user-event';");
  }

  // Import test utilities
  const hasTestUtils = await fileExists(path.join(path.dirname(componentPath), '..', 'utils', 'test-utils.ts'));
  if (hasTestUtils) {
    imports.push("import { mockReactUse } from '@/utils/test-utils';");
  }

  // Import the component (adjust path based on component location)
  const componentDir = path.dirname(componentPath);
  const relativeImportPath = path.basename(componentPath).replace(/\.(tsx|jsx|js)$/, '');

  // For components in __tests__ directory, import from parent
  const importPath = componentDir.endsWith('__tests__')
    ? `../${relativeImportPath}`
    : `../${relativeImportPath}`;

  imports.push(`import { ${componentName} } from '${importPath}';`);

  // If component uses hooks in a barrel export, import them
  if (componentContent.includes('useGame') || componentContent.includes('useUser')) {
    imports.push(`// Mocking hooks
vi.mock('@/hooks', () => ({
  useGame: vi.fn(() => ({ title: 'Test Game', description: 'Test Description' })),
  useUser: vi.fn(() => ({ name: 'Test User' })),
}));`);
  }

  // Add React's use hook mock if needed
  let useMock = '';
  if (needsUseMock) {
    if (hasTestUtils) {
      useMock = `
// Mock data for React's use hook
mockReactUse({
  title: 'Test Title',
  description: 'Test Description',
  id: 'test-id',
  data: [{ id: 1, name: 'Test Item' }]
});`;
    } else {
      useMock = `
// Mock React's use hook
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: vi.fn(() => ({
      title: 'Test Title',
      description: 'Test Description',
      id: 'test-id',
      data: [{ id: 1, name: 'Test Item' }]
    })),
  };
});`;
    }
  }

  // Generate fetch mock if needed
  let fetchMock = '';
  if (hasFetch && !needsUseMock) { // Skip if we're already mocking use()
    fetchMock = `
// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    title: 'Test Title',
    description: 'Test Description',
    id: 'test-id',
    data: [{ id: 1, name: 'Test Item' }]
  }),
});`;
  }

  // Generate prop mocks based on component props
  // Make sure props is either PropInfo[] or string[]
  const typedProps: PropInfo[] = props && Array.isArray(props) ? 
    props.map(p => typeof p === 'string' ? { name: p, type: guessTypeFromName(p) } : p as PropInfo) : 
    [];
  
  const propMocks = generatePropMocks(typedProps, componentContent);

  // Generate test cases
  const testCases = [];

  // Basic render test
  testCases.push(`
  it('renders ${componentName} correctly', () => {
    render(<${componentName} ${propMocks.propsJsx} />);

    // Assert component rendered
    ${generateBasicAssertions(context, componentContent)}
  });`);

  // Interaction tests for each event
  if (isInteractive) {
    // Check for button/click handling
    if (componentContent.includes('onClick') || componentContent.includes('handleClick')) {
      testCases.push(`
  it('handles click events correctly', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<${componentName} ${propMocks.propsJsx} onClick={handleClick} />);

    // Find and click the button
    const button = screen.getByRole('button');
    await user.click(button);

    // Assert handler was called
    expect(handleClick).toHaveBeenCalled();
  });`);
    }

    // Check for input/change handling
    if (componentContent.includes('onChange') || componentContent.includes('handleChange')) {
      testCases.push(`
  it('handles input changes correctly', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<${componentName} ${propMocks.propsJsx} onChange={handleChange} />);

    // Find and interact with the input
    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    // Assert handler was called
    expect(handleChange).toHaveBeenCalled();
  });`);
    }

    // Check for form submission
    if (componentContent.includes('onSubmit') || componentContent.includes('handleSubmit')) {
      testCases.push(`
  it('handles form submission correctly', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn(e => e.preventDefault());

    render(<${componentName} ${propMocks.propsJsx} onSubmit={handleSubmit} />);

    // Find and submit the form
    const form = screen.getByRole('form');
    await user.click(screen.getByRole('button', { type: 'submit' }));

    // Assert handler was called
    expect(handleSubmit).toHaveBeenCalled();
  });`);
    }
  }

  // Accessibility test
  testCases.push(`
  it('passes basic accessibility checks', () => {
    render(<${componentName} ${propMocks.propsJsx} />);

    // Basic accessibility assertions
    const button = screen.queryByRole('button');
    if (button) {
      expect(button).toHaveAttribute('aria-label');
    }

    const image = screen.queryByRole('img');
    if (image) {
      expect(image).toHaveAttribute('alt');
    }
  });`);

  // Combine everything
  return `${imports.join('\n')}

${useMock}
${fetchMock}

${propMocks.mockDefinitions}

describe('${componentName}', () => {
${testCases.join('\n')}
});
`;
}

/**
 * Generates component test content
 */
async function generateComponentTestContent(
  componentContext: ComponentContext, 
  componentPath: string
): Promise<string> {
  const { componentName } = componentContext;
  if (!componentName) {
    throw new Error('Component name is missing');
  }

  // Get component file name for import
  const fileName = path.basename(componentPath);
  const importPath = './' + path.basename(fileName, path.extname(fileName));
  
  // Determine if it's in a __tests__ directory
  const inTestsDir = componentPath.includes('__tests__');
  const relativeImportPath = inTestsDir ? `../${path.basename(fileName, path.extname(fileName))}` : importPath;

  // Determine what imports we need
  const needsUserEvent = componentContext.content.includes('onClick') || 
                        componentContext.content.includes('onChange') || 
                        componentContext.content.includes('onSubmit');
  
  const needsTestUtils = componentContext.content.includes('use(') || 
                        componentContext.content.includes('fetch(');
  
  // Create import section
  const imports = [
    `import { describe, it, expect, vi } from 'vitest';`,
    `import { render, screen } from '@testing-library/react';`,
  ];
  
  if (needsUserEvent) {
    imports.push(`import userEvent from '@testing-library/user-event';`);
  }
  
  // Add any hook mocks if needed
  if (componentContext.content.includes('useGame') || componentContext.content.includes('useUser')) {
    imports.push(`
// Mocking hooks
vi.mock('@/hooks', () => ({
  useGame: vi.fn(() => ({ title: 'Test Game', description: 'Test Description' })),
  useUser: vi.fn(() => ({ name: 'Test User' })),
}));`);
  }
  
  // Import the component
  imports.push(`import { ${componentName} } from '${relativeImportPath}';`);

  // Generate mock props based on componentContext (if available)
  let mockProps = '';
  const props = componentContext.props || [];
  if (props.length > 0) {
    const propsText = props.map(prop => {
      const name = typeof prop === 'string' ? prop : prop.name;
      const type = typeof prop === 'string' ? guessTypeFromName(prop) : (prop as any).type;
      
      // Generate mock value based on prop name and type
      let mockValue = '';
      if (name.startsWith('on') && name[2] === name[2].toUpperCase()) {
        mockValue = 'vi.fn()';
      } else if (type === 'string') {
        mockValue = `'Test ${name}'`;
      } else if (type === 'number') {
        mockValue = '42';
      } else if (type === 'boolean') {
        mockValue = 'true';
      } else if (type === 'array' || type === 'object[]') {
        mockValue = '[]';
      } else if (type === 'object') {
        mockValue = '{}';
      } else {
        mockValue = `'${name}'`;
      }
      
      return `  ${name}: ${mockValue}`;
    }).join(',\n');
    
    mockProps = `
// Mock props for component testing
const mockProps = {
${propsText}
};`;
  }

  // Generate test cases
  const testCases = [];
  
  // Basic render test
  testCases.push(`
  it('renders correctly', () => {
    render(<${componentName} ${mockProps ? '{...mockProps}' : ''} />);
    
    // Verify component renders
    expect(screen.getByTestId('${kebabCase(componentName)}')).toBeInTheDocument();
  });`);
  
  // If it has click handlers
  if (componentContext.content.includes('onClick') || componentContext.content.includes('handleClick')) {
    testCases.push(`
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<${componentName} ${mockProps ? '{...mockProps}' : ''} onClick={handleClick} />);
    
    // Find and click button
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Verify handler was called
    expect(handleClick).toHaveBeenCalled();
  });`);
  }
  
  // If it has prop changes
  if (props.length > 0) {
    testCases.push(`
  it('reflects prop changes', () => {
    const { rerender } = render(<${componentName} ${mockProps ? '{...mockProps}' : ''} />);
    
    // Rerender with different props
    rerender(<${componentName} ${mockProps ? '{...mockProps}' : ''} title="Updated Title" />);
    
    // Verify updated content
    expect(screen.getByText(/Updated Title/i)).toBeInTheDocument();
  });`);
  }
  
  // Combine everything
  return `${imports.join('\n')}
${mockProps}

describe('${componentName}', () => {${testCases.join('')}
});
`;
}

/**
 * Helper function to generate hook test content
 */
async function generateHookTestContent(hookPath: string, hookName: string): Promise<string> {
  // Create a relative import path
  const inTestsDir = hookPath.includes('__tests__');
  const fileName = path.basename(hookPath);
  const relativeImportPath = inTestsDir 
    ? `../${path.basename(fileName, path.extname(fileName))}` 
    : `./${path.basename(fileName, path.extname(fileName))}`;

  // Read the hook file to analyze its structure
  const hookContent = await readFile(hookPath);
  
  // Determine if it uses fetch or external data
  const usesFetch = hookContent.includes('fetch(') || hookContent.includes('axios.');
  const usesReactUse = hookContent.includes('use(');
  
  // Generate imports
  const imports = [
    `import { describe, it, expect, vi } from 'vitest';`,
    `import { renderHook, act } from '@testing-library/react';`
  ];
  
  // Add hook import
  imports.push(`import { ${hookName} } from '${relativeImportPath}';`);
  
  // Add any mocks needed
  let mocks = '';
  if (usesFetch) {
    mocks += `
// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ 
    id: 'test-id',
    title: 'Test Title',
    data: [1, 2, 3]
  })
});`;
  }
  
  if (usesReactUse) {
    mocks += `
// Mock React.use
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: vi.fn(() => ({ 
      id: 'test-id',
      title: 'Test Title',
      data: [1, 2, 3]
    }))
  };
});`;
  }
  
  // Generate test cases based on hook structure
  const testCases = [];
  
  // Basic hook rendering test
  testCases.push(`
  it('returns expected values', () => {
    const { result } = renderHook(() => ${hookName}('test-id'));
    
    // Verify hook returns expected data
    expect(result.current).toBeDefined();
    ${usesFetch || usesReactUse ? 'expect(result.current.title).toBe(\'Test Title\');' : ''}
  });`);
  
  // If the hook likely has state (contains useState)
  if (hookContent.includes('useState(')) {
    testCases.push(`
  it('handles state updates correctly', () => {
    const { result } = renderHook(() => ${hookName}('test-id'));
    
    // Test state updates if the hook has any setters
    act(() => {
      // Call any setters the hook returns
      if (typeof result.current.update === 'function') {
        result.current.update('new value');
      }
    });
    
    // Verify state was updated
    expect(result.current).toBeDefined();
  });`);
  }
  
  // If the hook has error handling
  if (hookContent.includes('catch') || hookContent.includes('Error')) {
    testCases.push(`
  it('handles errors correctly', async () => {
    // Mock fetch to reject
    ${usesFetch ? 'global.fetch.mockRejectedValueOnce(new Error(\'Test error\'));' : ''}
    
    const { result } = renderHook(() => ${hookName}('test-id'));
    
    // Verify error handling
    expect(result.current).toBeDefined();
    ${usesFetch ? 'expect(result.current.error).toBeDefined();' : ''}
  });`);
  }
  
  // Combine everything
  return `${imports.join('\n')}
${mocks}

describe('${hookName}', () => {${testCases.join('')}
});
`;
}

/**
 * Helper function to generate utility test content
 */
async function generateUtilityTestContent(utilPath: string, utilName: string): Promise<string> {
  // Create a relative import path
  const inTestsDir = utilPath.includes('__tests__');
  const fileName = path.basename(utilPath);
  const relativeImportPath = inTestsDir 
    ? `../${path.basename(fileName, path.extname(fileName))}` 
    : `./${path.basename(fileName, path.extname(fileName))}`;

  // Read the utility file to analyze its structure
  const utilContent = await readFile(utilPath);
  
  // Generate imports
  const imports = [
    `import { describe, it, expect, vi } from 'vitest';`
  ];
  
  // Add utility import
  imports.push(`import { ${utilName} } from '${relativeImportPath}';`);
  
  // Extract parameter names from the utility function
  const paramMatch = utilContent.match(new RegExp(`(function\\s+${utilName}|const\\s+${utilName}\\s*=\\s*(?:function)?\\s*)\\((.*?)\\)`, 's'));
  const params = paramMatch && paramMatch[2] 
    ? paramMatch[2].split(',').map(p => p.trim().split(':')[0].trim()) 
    : [];
  
  // Generate test cases
  const testCases = [];
  
  // Basic functionality test
  const paramArgs = params.map(p => {
    if (p.includes('id') || p.includes('name')) return `'test-${p}'`;
    if (p.includes('count') || p.includes('index')) return '0';
    if (p.includes('is') || p.includes('has')) return 'true';
    if (p.includes('options') || p.includes('config')) return '{}';
    if (p.includes('list') || p.includes('array')) return '[]';
    return `'${p}'`;
  }).join(', ');
  
  testCases.push(`
  it('produces correct output for basic input', () => {
    // Call the utility with test parameters
    const result = ${utilName}(${paramArgs});
    
    // Verify the result
    expect(result).toBeDefined();
  });`);
  
  // Edge case tests based on content analysis
  if (utilContent.includes('throw') || utilContent.includes('Error')) {
    testCases.push(`
  it('handles error cases correctly', () => {
    // Test with invalid input that would trigger errors
    expect(() => ${utilName}(${params.map(() => 'undefined').join(', ')})).toThrow();
  });`);
  }
  
  // Input transformation test if it's likely a transformer
  if (utilContent.includes('map') || utilContent.includes('filter') || utilContent.includes('reduce')) {
    testCases.push(`
  it('transforms input correctly', () => {
    // Test with sample input
    const sampleInput = ${params.length > 0 && params[0].includes('array') ? '[1, 2, 3]' : "'sample'"};
    const result = ${utilName}(sampleInput);
    
    // Verify transformation
    expect(result).not.toEqual(sampleInput);
  });`);
  }
  
  // Combine everything
  return `${imports.join('\n')}

describe('${utilName}', () => {${testCases.join('')}
});
`;
}

/**
 * Generates tests for all hooks
 */
export async function generateHookTests(
  context: ProjectContext,
  options: TestGenerationOptions = {}
): Promise<TestOperation[]> {
  const operations: TestOperation[] = [];
  const dryRun = options.dryRun || false;

  // Locate hooks directory
  const hooksDir = path.join(context.rootDir, 'src', 'hooks');
  const hooksDirExists = await fileExists(hooksDir);

  if (!hooksDirExists) {
    console.log('No hooks directory found');
    return operations;
  }

  console.log('Generating tests for hooks...');

  // Get hook files
  const allFiles = await getFilesWithExtension(hooksDir, ['.ts', '.tsx', '.js', '.jsx'], true);
  
  // Filter out test files and index files
  const hookFiles = allFiles.filter(file => {
    const filename = path.basename(file);
    return !filename.includes('.test.') && 
           !filename.includes('.spec.') && 
           filename !== 'index.ts' && 
           filename !== 'index.js' &&
           !file.includes('__tests__');
  });

  console.log(`Found ${hookFiles.length} hook files to process`);

  // Process each hook file
  for (const hookFile of hookFiles) {
    try {
      // Add file to project and analyze it
      const sourceFile = context.project.addSourceFileAtPath(hookFile);
      if (!sourceFile) {
        operations.push({
          type: 'error',
          filePath: hookFile,
          success: false,
          description: 'Could not parse source file'
        });
        continue;
      }
      
      // Detect exported hooks
      const { kind, name } = getExportableEntityKind(sourceFile);
      
      // Skip if not a hook or couldn't determine name
      if (kind !== 'hook' || !name) {
        operations.push({
          type: 'skip',
          filePath: hookFile,
          entityKind: kind,
          success: false,
          description: 'Not a hook or no export found'
        });
        continue;
      }
      
      // Determine test file path
      const parsedPath = path.parse(hookFile);
      let testDir: string;
      let testPath: string;
      
      // Check if we should use __tests__ directory
      const testsDir = path.join(parsedPath.dir, '__tests__');
      const testsDirExists = await fileExists(testsDir);
      
      if (testsDirExists) {
        testDir = testsDir;
        testPath = path.join(testDir, `${parsedPath.name}.test${parsedPath.ext}`);
      } else {
        testDir = parsedPath.dir;
        testPath = path.join(testDir, `${parsedPath.name}.test${parsedPath.ext}`);
      }
      
      // Check if test already exists
      const testExists = await fileExists(testPath);
      if (testExists && !options.overwrite) {
        operations.push({
          type: 'skip',
          filePath: hookFile,
          testPath,
          entityKind: 'hook',
          entityName: name,
          success: false,
          description: 'Test file already exists'
        });
        continue;
      }
      
      // Create test directory if it doesn't exist
      if (!await fileExists(testDir) && !dryRun) {
        await createDirectory(testDir);
      }
      
      // Generate test content
      const testContent = await generateHookTestContent(hookFile, name);
      
      // Write test file
      if (!dryRun) {
        await writeFile(testPath, testContent);
        
        operations.push({
          type: 'create',
          filePath: hookFile,
          testPath,
          entityKind: 'hook',
          entityName: name,
          success: true,
          description: `Created hook test for ${name}`
        });
      } else {
        operations.push({
          type: 'dryrun',
          filePath: hookFile,
          testPath,
          entityKind: 'hook',
          entityName: name,
          success: true,
          description: `Would create hook test for ${name}`
        });
      }
    } catch (error) {
      console.error(`Error generating test for ${hookFile}:`, error);
      operations.push({
        type: 'error',
        filePath: hookFile,
        success: false,
        description: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  return operations;
}

/**
 * Generates tests for utility functions
 */
export async function generateUtilityTests(
  context: ProjectContext,
  options: TestGenerationOptions = {}
): Promise<TestOperation[]> {
  const operations: TestOperation[] = [];
  const dryRun = options.dryRun || false;

  // Locate utils directory
  const utilsDir = path.join(context.rootDir, 'src', 'utils');
  const utilsDirExists = await fileExists(utilsDir);

  if (!utilsDirExists) {
    console.log('No utils directory found');
    return operations;
  }

  console.log('Generating tests for utility functions...');

  // Get utility files
  const allFiles = await getFilesWithExtension(utilsDir, ['.ts', '.tsx', '.js', '.jsx'], true);
  
  // Filter out test files, helper files, and already tested files
  const utilFiles = allFiles.filter(file => {
    const filename = path.basename(file);
    return !filename.includes('.test.') && 
           !filename.includes('.spec.') && 
           filename !== 'index.ts' && 
           filename !== 'index.js' &&
           !filename.includes('test-utils') && // Skip test utilities
           !file.includes('__tests__');
  });

  console.log(`Found ${utilFiles.length} utility files to process`);

  // Process each utility file
  for (const utilFile of utilFiles) {
    try {
      // Add file to project and analyze it
      const sourceFile = context.project.addSourceFileAtPath(utilFile);
      if (!sourceFile) {
        operations.push({
          type: 'error',
          filePath: utilFile,
          success: false,
          description: 'Could not parse source file'
        });
        continue;
      }
      
      // Detect exported utilities
      const { kind, name } = getExportableEntityKind(sourceFile);
      
      // Skip if not a utility or couldn't determine name
      if (kind !== 'utility' || !name) {
        operations.push({
          type: 'skip',
          filePath: utilFile,
          entityKind: kind,
          success: false,
          description: 'Not a utility function or no export found'
        });
        continue;
      }
      
      // Determine test file path
      const parsedPath = path.parse(utilFile);
      let testDir: string;
      let testPath: string;
      
      // Check if we should use __tests__ directory
      const testsDir = path.join(parsedPath.dir, '__tests__');
      const testsDirExists = await fileExists(testsDir);
      
      if (testsDirExists) {
        testDir = testsDir;
        testPath = path.join(testDir, `${parsedPath.name}.test${parsedPath.ext}`);
      } else {
        testDir = parsedPath.dir;
        testPath = path.join(testDir, `${parsedPath.name}.test${parsedPath.ext}`);
      }
      
      // Check if test already exists
      const testExists = await fileExists(testPath);
      if (testExists && !options.overwrite) {
        operations.push({
          type: 'skip',
          filePath: utilFile,
          testPath,
          entityKind: 'utility',
          entityName: name,
          success: false,
          description: 'Test file already exists'
        });
        continue;
      }
      
      // Create test directory if it doesn't exist
      if (!await fileExists(testDir) && !dryRun) {
        await createDirectory(testDir);
      }
      
      // Generate test content
      const testContent = await generateUtilityTestContent(utilFile, name);
      
      // Write test file
      if (!dryRun) {
        await writeFile(testPath, testContent);
        
        operations.push({
          type: 'create',
          filePath: utilFile,
          testPath,
          entityKind: 'utility',
          entityName: name,
          success: true,
          description: `Created utility test for ${name}`
        });
      } else {
        operations.push({
          type: 'dryrun',
          filePath: utilFile,
          testPath,
          entityKind: 'utility',
          entityName: name,
          success: true,
          description: `Would create utility test for ${name}`
        });
      }
    } catch (error) {
      console.error(`Error generating test for ${utilFile}:`, error);
      operations.push({
        type: 'error',
        filePath: utilFile,
        success: false,
        description: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  return operations;
}

// Prop type definition
interface PropInfo {
  name: string;
  type: string;
}

// Helper to generate mock props based on component props
function generatePropMocks(props: PropInfo[] | string[], componentContent: string): { mockDefinitions: string, propsJsx: string } {
  // If no props specified, try to extract from content
  const extractedProps = props.length === 0 ? extractPropsFromContent(componentContent) : props;

  if (extractedProps.length === 0) {
    return { mockDefinitions: '', propsJsx: '' };
  }

  const mockDefinitions = `
// Mock props for testing
const mockProps = {
  ${extractedProps.map(prop => {
    const propName = typeof prop === 'string' ? prop : prop.name;
    const propType = typeof prop === 'string' ? guessTypeFromName(prop) : prop.type;
    return `${propName}: ${getMockValueForType(propType, propName)}`;
  }).join(',\n  ')}
};`.trim();

  const propsJsx = `{...mockProps}`;

  return { mockDefinitions, propsJsx };
}

// Helper to generate mock values for different types
function getMockValueForType(type: string, name: string): string {
  if (name.includes('on') && name.length > 2 && name[2].toUpperCase() === name[2]) {
    return 'vi.fn()'; // Event handler
  }

  switch (type) {
    case 'string':
      if (name.includes('id')) return "'test-id'";
      if (name.includes('name')) return "'Test Name'";
      if (name.includes('title')) return "'Test Title'";
      if (name.includes('description')) return "'Test Description'";
      return "'test string'";
    case 'number':
      return '42';
    case 'boolean':
      return 'true';
    case 'function':
      return 'vi.fn()';
    case 'array':
      return '[]';
    case 'object':
      return '{}';
    default:
      return "''";
  }
}

// Helper to generate basic assertions for a component
function generateBasicAssertions(context: ComponentContext, componentContent: string): string {
  const assertions = [];

  // Check for headings
  if (componentContent.includes('<h1') || componentContent.includes('<h2') ||
      componentContent.includes('<h3') || componentContent.includes('<h4')) {
    assertions.push(`expect(screen.getByRole('heading')).toBeInTheDocument();`);
  }

  // Check for specific text
  const textMatches = componentContent.match(/{([^{}]+)}/g);
  if (textMatches && textMatches.length > 0) {
    const dynamicText = textMatches[0].replace('{', '').replace('}', '').trim();
    if (dynamicText.includes('.') || dynamicText.includes('[')) {
      assertions.push(`expect(screen.getByText(/test/i)).toBeInTheDocument();`);
    }
  }

  // Check for buttons
  if (componentContent.includes('<button') || componentContent.includes('role="button"')) {
    assertions.push(`expect(screen.getByRole('button')).toBeInTheDocument();`);
  }

  // Check for images
  if (componentContent.includes('<img') || componentContent.includes('role="img"')) {
    assertions.push(`expect(screen.getByRole('img')).toBeInTheDocument();`);
  }

  // Check for data-testid
  if (componentContent.includes('data-testid=')) {
    const testIdMatch = componentContent.match(/data-testid=['"]([^'"]+)['"]/);
    if (testIdMatch) {
      assertions.push(`expect(screen.getByTestId('${testIdMatch[1]}')).toBeInTheDocument();`);
    }
  }

  if (assertions.length === 0) {
    const componentName = context.componentName || 'component';
    return `expect(screen.getByTestId('${kebabCase(componentName)}')).toBeInTheDocument();`;
  }

  return assertions.join('\n    ');
}

// Helper to extract props from component content
function extractPropsFromContent(content: string): string[] {
  // Look for props usage
  const propsMatch = content.match(/props\.(\w+)/g);
  if (propsMatch) {
    return propsMatch.map(match => match.replace('props.', ''));
  }

  // Look for destructured props
  const destructuredMatch = content.match(/\(\{\s*([^{}]+)\s*\}\)/);
  if (destructuredMatch) {
    const propString = destructuredMatch[1];
    return propString.split(',').map(prop => prop.trim());
  }

  return [];
}

// Helper function as fallback (in case guessTypeFromName from ast.ts fails)
function guessTypeFromPropName(name: string): string {
  if (name.startsWith('on') && name.length > 2 && name[2].toUpperCase() === name[2]) {
    return 'function';
  }

  if (name.includes('id') || name.includes('name') || name.includes('title') ||
      name.includes('description') || name.includes('label') || name.includes('text')) {
    return 'string';
  }

  if (name.includes('count') || name.includes('index') || name.includes('size') ||
      name.includes('length') || name.includes('width') || name.includes('height')) {
    return 'number';
  }

  if (name.includes('is') || name.includes('has') || name.includes('show') ||
      name.includes('enable') || name.includes('disable') || name.includes('active')) {
    return 'boolean';
  }

  if (name.includes('items') || name.includes('list') || name.includes('options') ||
      name.includes('data') && !name.includes('datum')) {
    return 'array';
  }

  if (name.includes('style') || name.includes('config') || name.includes('options') ||
      name.includes('settings')) {
    return 'object';
  }

  return 'string';
}

// Helper function to convert string to kebab-case
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
