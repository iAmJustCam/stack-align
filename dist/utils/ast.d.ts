import { Project, SourceFile } from 'ts-morph';
/**
 * Creates a new ts-morph Project instance
 */
export declare function createProject(): Project;
/**
 * Adds a source file to the project
 */
export declare function addSourceFile(project: Project, filePath: string): SourceFile | undefined;
/**
 * Gets all React component declarations from a source file
 */
export declare function getComponentDeclarations(sourceFile: SourceFile): (import("ts-morph").FunctionDeclaration | import("ts-morph").VariableDeclaration)[];
/**
 * Gets all imports from a source file
 */
export declare function getImports(sourceFile: SourceFile): import("ts-morph").ImportDeclaration[];
/**
 * Gets all hook declarations from a source file
 */
export declare function getHookDeclarations(sourceFile: SourceFile): import("ts-morph").FunctionDeclaration[];
/**
 * Transforms a source file using ts-morph
 */
export declare function transformSourceFile(sourceFile: SourceFile, transformFn: (sf: SourceFile) => void): string;
/**
 * Saves changes to a source file
 */
export declare function saveSourceFile(sourceFile: SourceFile): Promise<void>;
/**
 * Parses a component file to extract component information
 *
 * @param filePath Path to the component file
 * @param content Component file content (optional, will be read from file if not provided)
 * @returns ComponentContext with information about the component
 */
export declare function parseComponent(filePath: string, content?: string): Promise<import('../types').ComponentContext>;
/**
 * Helper to guess type from prop name
 */
export declare function guessTypeFromName(name: string): string;
/**
 * Parse a file with TypeScript analysis
 *
 * @param filePath Path to the file to parse
 * @returns Parsed file information with TypeScript analysis
 */
export declare function parseTypeScript(filePath: string): Promise<{
    filePath: string;
    content: string;
    isReactComponent: boolean;
    isFunctionalComponent: boolean;
    componentDeclarationLine: number;
    propInterfaceName?: string;
    propInterfaceLine?: number;
    hasUntypedProps: boolean;
    untypedPropsLine?: number;
    usesAnyType: boolean;
    anyTypeLine?: number;
    isHook: boolean;
    hasHookReturnType?: boolean;
    hookDeclarationLine?: number;
    hasHookGenericParams: boolean;
    hasWeakGenericConstraints?: boolean;
    hookGenericParamsLine?: number;
    isContextProvider: boolean;
    hasContextType?: boolean;
    hasContextDefaultValue?: boolean;
    contextDeclarationLine?: number;
    shouldUseUtilityTypes: boolean;
    utilityTypeCandidateLine?: number;
    hasComplexInlineTypes: boolean;
    complexInlineTypeLine?: number;
    hasTypeOnlyImportsWithoutTypeKeyword: boolean;
    typeOnlyImportLine?: number;
    hasExportedFunctionsWithoutJSDoc: boolean;
    exportedFunctionLine?: number;
    hasInterfacePropsWithoutJSDoc: boolean;
    interfaceWithoutJSDocLine?: number;
    usesReactFC: boolean;
    hasPropInterface: boolean;
    couldUseConstTypeParams?: boolean;
    constTypeParamCandidateLine?: number;
    usesSatisfiesOperator?: boolean;
    satisfiesOperatorLine?: number;
    hasInterfaceWithOptionalProps?: boolean;
    interfaceWithOptionalPropsLine?: number;
}>;
/**
 * Parse a JavaScript/TypeScript file for general information
 *
 * @param filePath Path to the file to parse
 * @returns Parsed file information
 */
export declare function parseFile(filePath: string): Promise<{
    filePath: string;
    content: string;
    imports: {
        source: string;
        names: string[];
    }[];
    exports: string[];
    functionCalls: {
        name: string;
        args: string[];
    }[];
}>;
/**
 * Analyze Next.js routes in a project
 *
 * @param projectDir Path to the project directory
 * @returns Information about the Next.js routes
 */
export declare function analyzeRoutes(projectDir: string): Promise<{
    hasAppRouter: boolean;
    hasPagesRouter: boolean;
    appRoutes: {
        path: string;
        isPage: boolean;
        isLayout: boolean;
        isRoute: boolean;
        isServerComponent: boolean;
    }[];
    pageRoutes: {
        path: string;
        isDynamic: boolean;
        hasApi: boolean;
    }[];
}>;
