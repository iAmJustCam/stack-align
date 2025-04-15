// src/validators/architecture-validator.ts
import path from "path";
import fs from "fs";
import { Node, SyntaxKind } from "ts-morph";
import type { ProjectContext, ValidationIssue, ValidationResult } from "../types";
import { scanProject } from "../utils/project-scanner";

/**
 * Validates project architecture against established guidelines
 */
export async function validateArchitecture(
  context: ProjectContext
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  // Run all architecture checks
  const directoryStructureIssues = await validateDirectoryStructure(context);
  issues.push(...directoryStructureIssues);

  const fileNamingIssues = await validateFileNaming(context);
  issues.push(...fileNamingIssues);

  const barrelExportIssues = await validateBarrelExports(context);
  issues.push(...barrelExportIssues);

  const typeDefinitionIssues = await validateTypeDefinitions(context);
  issues.push(...typeDefinitionIssues);

  const serviceSeparationIssues = await validateServiceSeparation(context);
  issues.push(...serviceSeparationIssues);

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validates directory structure follows flat organization (≤2 levels deep)
 */
async function validateDirectoryStructure(
  context: ProjectContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const srcDir = path.join(context.rootDir, "src");

  // Check if src directory exists
  const srcExists = fs.existsSync(srcDir);

  if (!srcExists) {
    issues.push({
      type: "error",
      message: 'Project must use a "src" directory for source files',
      filePath: context.rootDir,
      line: 0,
      code: "ARCH_MISSING_SRC_DIR",
      framework: "architecture",
      fix: {
        type: "create_directory",
        path: srcDir,
        description: "Create src directory and move source files into it",
      },
    });
    return issues;
  }

  // Get all directories inside src recursively to check depth
  const allDirs = await getAllDirectories(srcDir);

  for (const dir of allDirs) {
    const depth = getDirectoryDepth(dir, srcDir);

    // Our constraint is max 2 levels deep from src
    if (depth > 2) {
      issues.push({
        type: "error",
        message: `Directory "${dir}" exceeds maximum nesting depth (2 levels from src)`,
        filePath: dir,
        line: 0,
        code: "ARCH_EXCESSIVE_NESTING",
        framework: "architecture",
        fix: {
          type: "manual",
          description:
            "Flatten directory structure by moving files to parent directories",
          steps: [
            `Identify files in ${dir}`,
            "Move files to appropriate top-level directories under src/",
            "Update imports to reflect new file locations",
          ],
        },
      });
    }
  }

  // Validate required directory structure
  const requiredDirs = ["components", "hooks", "types", "utils"];
  const srcDirs = fs.readdirSync(srcDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const required of requiredDirs) {
    if (!srcDirs.includes(required)) {
      issues.push({
        type: "error",
        message: `Missing required directory: src/${required}`,
        filePath: srcDir,
        line: 0,
        code: "ARCH_MISSING_REQUIRED_DIR",
        framework: "architecture",
        fix: {
          type: "create_directory",
          path: path.join(srcDir, required),
          description: `Create src/${required} directory`,
        },
      });
    }
  }

  return issues;
}

/**
 * Validates file naming conventions (kebab-case for files, PascalCase for components)
 */
async function validateFileNaming(
  context: ProjectContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const srcDir = path.join(context.rootDir, "src");

  // Scan project to get component files
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  for (const filePath of componentFiles) {
    const basename = path.basename(filePath);

    // Skip index files and test files
    if (
      basename === "index.ts" ||
      basename === "index.tsx" ||
      basename.includes(".test.")
    ) {
      continue;
    }

    // File name should be kebab-case
    if (!isKebabCase(basename.split(".")[0])) {
      issues.push({
        type: "error",
        message: `Component file "${basename}" should use kebab-case`,
        filePath,
        line: 0,
        code: "ARCH_NON_KEBAB_FILENAME",
        framework: "architecture",
        fix: {
          type: "rename_file",
          oldPath: filePath,
          newPath: path.join(
            path.dirname(filePath),
            toKebabCase(basename.split(".")[0]) + path.extname(basename)
          ),
          description: `Rename file to use kebab-case`,
        },
      });
    }

    // Check component name is PascalCase inside the file using ts-morph
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Find component declarations
    const exportedVariables = sourceFile.getVariableDeclarations().filter(decl => {
      const declarationList = decl.getFirstAncestorByKind(SyntaxKind.VariableDeclarationList);
      const exportKeyword = declarationList?.getFirstAncestorByKind(SyntaxKind.VariableStatement)
        ?.getFirstModifierByKind(SyntaxKind.ExportKeyword);
      return !!exportKeyword;
    });

    for (const variable of exportedVariables) {
      const componentName = variable.getName();
      if (componentName && !isPascalCase(componentName)) {
        const pos = variable.getNameNode().getStartLineNumber();
        issues.push({
          type: "error",
          message: `Component "${componentName}" should use PascalCase`,
          filePath,
          line: pos,
          code: "ARCH_NON_PASCAL_COMPONENT",
          framework: "architecture",
          fix: {
            type: "replace",
            pattern: `export const ${componentName}`,
            replacement: `export const ${toPascalCase(componentName)}`,
            description: `Rename component to use PascalCase`,
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Validates barrel exports (index.ts files)
 */
async function validateBarrelExports(
  context: ProjectContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const srcDir = path.join(context.rootDir, "src");

  // Check for barrel exports in key directories
  const barrelDirs = ["components", "hooks", "utils"];

  for (const dir of barrelDirs) {
    const dirPath = path.join(srcDir, dir);
    const dirExists = fs.existsSync(dirPath);

    if (dirExists) {
      const indexPath = path.join(dirPath, "index.ts");
      const hasBarrel = fs.existsSync(indexPath);

      if (!hasBarrel) {
        issues.push({
          type: "error",
          message: `Missing barrel export file (index.ts) in src/${dir}`,
          filePath: dirPath,
          line: 0,
          code: "ARCH_MISSING_BARREL",
          framework: "architecture",
          fix: {
            type: "create_file",
            path: indexPath,
            content: `/**\n * Barrel export file for ${dir}\n */\n\n`,
            description: `Create index.ts barrel file in src/${dir}`,
          },
        });
      } else {
        // Barrel exists, check if it exports all relevant files using ts-morph
        const indexFile = context.project.getSourceFile(indexPath);
        if (!indexFile) continue;

        // Get all files in the directory (excluding index.ts and test files)
        const dirFiles = fs.readdirSync(dirPath)
          .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
          .filter(file => file !== 'index.ts' && !file.includes('.test.') && !file.includes('.spec.'));
        
        // Get all export declarations from the barrel file
        const exportDeclarations = indexFile.getExportDeclarations();
        const exportedModules = exportDeclarations
          .map(exp => exp.getModuleSpecifierValue())
          .filter(Boolean as any)
          .map(specifier => {
            if (specifier?.startsWith('./')) {
              return specifier.substring(2); // Remove './'
            }
            return specifier;
          });

        for (const file of dirFiles) {
          const baseName = file.split(".")[0];
          
          if (!exportedModules.includes(baseName)) {
            issues.push({
              type: "warning",
              message: `Barrel file does not export "${baseName}"`,
              filePath: indexPath,
              line: 0,
              code: "ARCH_INCOMPLETE_BARREL",
              framework: "architecture",
              fix: {
                type: "append",
                path: indexPath,
                content: `export * from './${baseName}';\n`,
                description: `Add export for ${baseName} in barrel file`,
              },
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Validates type definitions are properly located in src/types
 */
async function validateTypeDefinitions(
  context: ProjectContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const srcDir = path.join(context.rootDir, "src");
  const typesDir = path.join(srcDir, "types");

  // Check if types directory exists
  const typesExists = fs.existsSync(typesDir);

  if (!typesExists) {
    // Already covered by directory structure validation
    return issues;
  }

  // Scan project to get component files
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Look for interface or type definitions for props
    const interfaces = sourceFile.getInterfaces();
    const typeAliases = sourceFile.getTypeAliases();

    // Check interfaces
    for (const interfaceDecl of interfaces) {
      const name = interfaceDecl.getName();
      if (name.endsWith('Props')) {
        // Check if this is used in multiple files - if so, it should be in types directory
        const isUsedInMultipleFiles = await isTypeUsedInMultipleFiles(
          context,
          name
        );

        if (isUsedInMultipleFiles) {
          const componentName = path.basename(filePath).split(".")[0];
          const typeFile = `${componentName.split("-").join("")}.ts`;
          const line = interfaceDecl.getStartLineNumber();

          issues.push({
            type: "warning",
            message: `Type "${name}" is used in multiple files and should be moved to src/types/${typeFile}`,
            filePath,
            line,
            code: "ARCH_MISPLACED_TYPE",
            framework: "architecture",
            fix: {
              type: "manual",
              description: `Move "${name}" to dedicated type file`,
              steps: [
                `Create or update src/types/${typeFile}`,
                `Add "export interface ${name} {...}" to the type file`,
                `Remove the interface from ${filePath}`,
                `Add "import type { ${name} } from '@/types/${
                  typeFile.split(".")[0]
                }';" to ${filePath}`,
              ],
            },
          });
        }
      }
    }

    // Check type aliases
    for (const typeAlias of typeAliases) {
      const name = typeAlias.getName();
      if (name.endsWith('Props')) {
        // Check if this is used in multiple files - if so, it should be in types directory
        const isUsedInMultipleFiles = await isTypeUsedInMultipleFiles(
          context,
          name
        );

        if (isUsedInMultipleFiles) {
          const componentName = path.basename(filePath).split(".")[0];
          const typeFile = `${componentName.split("-").join("")}.ts`;
          const line = typeAlias.getStartLineNumber();

          issues.push({
            type: "warning",
            message: `Type "${name}" is used in multiple files and should be moved to src/types/${typeFile}`,
            filePath,
            line,
            code: "ARCH_MISPLACED_TYPE",
            framework: "architecture",
            fix: {
              type: "manual",
              description: `Move "${name}" to dedicated type file`,
              steps: [
                `Create or update src/types/${typeFile}`,
                `Add "export type ${name} = ..." to the type file`,
                `Remove the type from ${filePath}`,
                `Add "import type { ${name} } from '@/types/${
                  typeFile.split(".")[0]
                }';" to ${filePath}`,
              ],
            },
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Validates separation of concerns (data fetching in hooks, not components)
 */
async function validateServiceSeparation(
  context: ProjectContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  // Scan project to get component files
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Check for "use client" directive
    const isServerComponent = !sourceFile.getFullText().includes('"use client"');

    // Check for fetch operations using ts-morph
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const hasFetch = callExpressions.some(call => {
      const expression = call.getExpression();
      return Node.isIdentifier(expression) && expression.getText() === 'fetch';
    });

    const hasAxios = callExpressions.some(call => {
      const expression = call.getExpression();
      if (Node.isPropertyAccessExpression(expression)) {
        const object = expression.getExpression();
        const property = expression.getName();
        return Node.isIdentifier(object) && 
               object.getText() === 'axios' && 
               (property === 'get' || property === 'post');
      }
      return false;
    });

    // Check if component imports use from React (for React 19 hook)
    const hasUseImport = sourceFile.getImportDeclarations().some(imp => {
      if (imp.getModuleSpecifierValue() === 'react') {
        const namedImports = imp.getNamedImports();
        return namedImports.some(named => named.getName() === 'use');
      }
      return false;
    });

    if ((hasFetch || hasAxios) && !isServerComponent && !hasUseImport) {
      issues.push({
        type: "error",
        message: "Data fetching should be extracted to custom hooks",
        filePath,
        line: 0,
        code: "ARCH_DATA_FETCHING_IN_COMPONENT",
        framework: "architecture",
        fix: {
          type: "manual",
          description: "Extract data fetching logic to a custom hook",
          steps: [
            `Identify the data fetching logic in ${filePath}`,
            "Create a custom hook in src/hooks/",
            "Move the fetching logic to the hook",
            `Update ${filePath} to use the custom hook`,
          ],
        },
      });
    }
  }

  return issues;
}

/**
 * Checks if a type definition is used in multiple files
 * Using ts-morph to search references
 */
async function isTypeUsedInMultipleFiles(
  context: ProjectContext,
  typeName: string
): Promise<boolean> {
  const references = context.project.getSourceFiles().flatMap(sourceFile => {
    return sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
      .filter(id => id.getText() === typeName);
  });

  // Get unique file paths
  const filePaths = new Set(references.map(ref => ref.getSourceFile().getFilePath()));
  
  // If used in more than one file, it should be in types directory
  return filePaths.size > 1;
}

/**
 * Helper to get the directory depth
 */
function getDirectoryDepth(dir: string, rootDir: string): number {
  const relativePath = path.relative(rootDir, dir);
  return relativePath.split(path.sep).filter(Boolean).length;
}

/**
 * Helper to get all directories recursively
 */
async function getAllDirectories(rootDir: string): Promise<string[]> {
  const result: string[] = [];
  
  // Get immediate subdirectories
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const dirs = entries.filter(entry => entry.isDirectory());
  
  // Add each directory and recursively get its subdirectories
  for (const dir of dirs) {
    const dirPath = path.join(rootDir, dir.name);
    result.push(dirPath);
    
    // Recursively get subdirectories
    const subDirs = await getAllDirectories(dirPath);
    result.push(...subDirs);
  }
  
  return result;
}

/**
 * Checks if a string is kebab-case
 */
function isKebabCase(str: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}

/**
 * Checks if a string is PascalCase
 */
function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Helper to convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Helper to convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}