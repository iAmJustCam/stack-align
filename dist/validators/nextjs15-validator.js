"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNextJs15Implementation = validateNextJs15Implementation;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ts_morph_1 = require("ts-morph");
const ast_1 = require("../utils/ast");
const fs_1 = require("../utils/fs");
/**
 * Validates Next.js 15 implementation in a project
 */
async function validateNextJs15Implementation(context) {
    const issues = [];
    console.log('Validating Next.js 15 implementation...');
    // Check for App Router implementation
    const appRouterIssues = await validateAppRouter(context);
    issues.push(...appRouterIssues);
    // Check for proper metadata configuration
    const metadataIssues = await validateMetadata(context);
    issues.push(...metadataIssues);
    // Check for route handlers implementation
    const routeHandlerIssues = await validateRouteHandlers(context);
    issues.push(...routeHandlerIssues);
    // Check for proper data fetching patterns
    const dataFetchingIssues = await validateDataFetching(context);
    issues.push(...dataFetchingIssues);
    // Check next.config.js
    const configIssues = await validateNextConfig(context);
    issues.push(...configIssues);
    // Check for middleware implementation
    const middlewareIssues = await validateMiddleware(context);
    issues.push(...middlewareIssues);
    // Check for async layout APIs
    const asyncLayoutIssues = await validateAsyncLayoutAPIs(context);
    issues.push(...asyncLayoutIssues);
    // Check for dynamic route segments
    const dynamicRouteIssues = await validateDynamicRouteSegments(context);
    issues.push(...dynamicRouteIssues);
    // Check for generateStaticParams typing
    const staticParamsIssues = await validateGenerateStaticParams(context);
    issues.push(...staticParamsIssues);
    // Check for legacy API in App Router
    const legacyApiIssues = await validateLegacyApiInAppRouter(context);
    issues.push(...legacyApiIssues);
    // Check for image optimization
    const imageOptimizationIssues = await validateImageOptimization(context);
    issues.push(...imageOptimizationIssues);
    return {
        valid: issues.length === 0,
        issues,
    };
}
/**
 * Validates App Router implementation
 */
async function validateAppRouter(context) {
    const issues = [];
    console.log('Checking App Router implementation...');
    // Check for app directory
    const hasAppDirectory = await (0, fs_1.directoryExists)(path.join(context.rootDir, 'src', 'app'));
    const hasPagesDirectory = await (0, fs_1.directoryExists)(path.join(context.rootDir, 'src', 'pages'));
    if (!hasAppDirectory && hasPagesDirectory) {
        issues.push({
            type: 'error',
            message: 'Project is using Pages Router instead of App Router',
            filePath: context.rootDir,
            line: 0,
            code: 'NEXTJS15_USING_PAGES_ROUTER',
            framework: 'nextjs',
            fix: {
                type: 'manual',
                description: 'Migrate from Pages Router to App Router',
                steps: [
                    'Create a src/app/ directory in your project root',
                    'Create a layout.tsx file in the src/app/ directory',
                    'Move page components from src/pages/ to src/app/ following the new routing conventions',
                ],
            },
            documentation: 'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration',
        });
    }
    // Check for proper layout.tsx implementation
    if (hasAppDirectory) {
        const rootLayoutPath = path.join(context.rootDir, 'src', 'app', 'layout.tsx');
        const layoutExists = await (0, fs_1.fileExists)(rootLayoutPath);
        if (!layoutExists) {
            issues.push({
                type: 'error',
                message: 'Missing root layout.tsx in app directory',
                filePath: path.join(context.rootDir, 'src', 'app'),
                line: 0,
                code: 'NEXTJS15_MISSING_ROOT_LAYOUT',
                framework: 'nextjs',
                fix: {
                    type: 'create_file',
                    path: rootLayoutPath,
                    content: `
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
          `.trim(),
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#layouts',
            });
        }
        else {
            // Check if layout includes metadata
            const layoutContent = await (0, ast_1.parseFile)(rootLayoutPath);
            if (!layoutContent.content.includes('export const metadata')) {
                issues.push({
                    type: 'warning',
                    message: 'Root layout.tsx is missing metadata export',
                    filePath: rootLayoutPath,
                    line: 0,
                    code: 'NEXTJS15_MISSING_METADATA',
                    framework: 'nextjs',
                    fix: {
                        type: 'manual',
                        description: 'Add metadata export to layout.tsx',
                        steps: [
                            "Import Metadata: import type { Metadata } from 'next';",
                            'Add metadata export: export const metadata: Metadata = { title: "App Title", description: "App Description" };'
                        ]
                    },
                    documentation: 'https://nextjs.org/docs/app/building-your-application/optimizing/metadata',
                });
            }
        }
        // Check for globals.css
        const globalsCssPath = path.join(context.rootDir, 'src', 'app', 'globals.css');
        const globalsCssExists = await (0, fs_1.fileExists)(globalsCssPath);
        if (!globalsCssExists) {
            issues.push({
                type: 'warning',
                message: 'Missing globals.css in app directory',
                filePath: path.join(context.rootDir, 'src', 'app'),
                line: 0,
                code: 'NEXTJS15_MISSING_GLOBALS_CSS',
                framework: 'nextjs',
                fix: {
                    type: 'create_file',
                    path: globalsCssPath,
                    content: `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
          `.trim(),
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/styling/css-modules',
            });
        }
    }
    // Check route groups
    if (hasAppDirectory) {
        const appDirPath = path.join(context.rootDir, 'src', 'app');
        const routeAnalysis = await (0, ast_1.analyzeRoutes)(appDirPath);
        // Check for nested routes more than 3 levels deep
        const allRoutes = [
            ...routeAnalysis.appRoutes.map(route => ({ ...route, depth: route.path.split('/').length })),
            ...routeAnalysis.pageRoutes.map(route => ({ ...route, depth: route.path.split('/').length }))
        ];
        const deepRoutes = allRoutes.filter((route) => route.depth > 3);
        if (deepRoutes.length > 0) {
            issues.push({
                type: 'warning',
                message: 'Deeply nested routes detected - consider using route groups',
                filePath: appDirPath,
                line: 0,
                code: 'NEXTJS15_DEEP_ROUTES',
                framework: 'nextjs',
                fix: {
                    type: 'manual',
                    description: 'Use route groups to organize routes',
                    steps: [
                        'Create (group) folders to organize related routes',
                        'Move deeply nested routes into appropriate groups',
                        'See documentation for examples'
                    ]
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/routing/route-groups',
            });
        }
    }
    return issues;
}
/**
 * Validates metadata configuration
 */
async function validateMetadata(context) {
    const issues = [];
    console.log('Checking metadata implementation...');
    const appDirPath = path.join(context.rootDir, 'src', 'app');
    const hasAppDirectory = await (0, fs_1.directoryExists)(appDirPath);
    if (!hasAppDirectory) {
        return issues; // Skip if app directory doesn't exist
    }
    // Get all page files
    const pageFiles = await (0, fs_1.getFilesWithExtension)(appDirPath, ['.tsx']);
    const pageRoutes = pageFiles.filter(file => {
        const basename = path.basename(file);
        return basename === 'page.tsx';
    });
    // Check for metadata in page files
    for (const pagePath of pageRoutes) {
        const content = await (0, ast_1.parseFile)(pagePath);
        const sourceFile = context.project.getSourceFile(pagePath);
        if (!sourceFile)
            continue;
        // Skip if file already has metadata
        if (content.content.includes('export const metadata') || content.content.includes('export async function generateMetadata')) {
            // Check for required fields in the metadata object if it exists
            const metadataVariable = sourceFile.getVariableDeclaration('metadata');
            if (metadataVariable) {
                const initializer = metadataVariable.getInitializer();
                if (initializer && ts_morph_1.Node.isObjectLiteralExpression(initializer)) {
                    const properties = initializer.getProperties();
                    const hasTitle = properties.some(prop => ts_morph_1.Node.isPropertyAssignment(prop) &&
                        prop.getName() === 'title');
                    const hasDescription = properties.some(prop => ts_morph_1.Node.isPropertyAssignment(prop) &&
                        prop.getName() === 'description');
                    const hasOpenGraph = properties.some(prop => ts_morph_1.Node.isPropertyAssignment(prop) &&
                        prop.getName() === 'openGraph');
                    if (!hasTitle || !hasDescription) {
                        issues.push({
                            type: 'warning',
                            message: `Metadata in ${path.relative(context.rootDir, pagePath)} is missing required fields (title, description)`,
                            filePath: pagePath,
                            line: metadataVariable.getStartLineNumber(),
                            code: 'NEXTJS15_INCOMPLETE_METADATA',
                            framework: 'nextjs',
                            fix: {
                                type: 'manual',
                                description: 'Add required fields to metadata object',
                                steps: [
                                    'Add title: title: "Page Title",',
                                    'Add description: description: "Page description",'
                                ]
                            },
                            documentation: 'https://nextjs.org/docs/app/building-your-application/optimizing/metadata',
                        });
                    }
                    if (!hasOpenGraph) {
                        issues.push({
                            type: 'suggestion',
                            message: `Consider adding OpenGraph metadata for better social sharing`,
                            filePath: pagePath,
                            line: metadataVariable.getStartLineNumber(),
                            code: 'NEXTJS15_MISSING_OPENGRAPH',
                            framework: 'nextjs',
                            fix: {
                                type: 'manual',
                                description: 'Add OpenGraph metadata for social sharing',
                                steps: [
                                    'Add openGraph field to metadata:',
                                    `openGraph: {
  title: 'Same as page title',
  description: 'Same as page description',
  images: [{ url: '/og-image.jpg', width: 1200, height: 630 }]
}`
                                ]
                            },
                            documentation: 'https://nextjs.org/docs/app/building-your-application/optimizing/metadata#openGraph',
                        });
                    }
                }
            }
            continue;
        }
        // Check if the page would benefit from metadata
        const relativePath = pagePath.replace(context.rootDir, '');
        issues.push({
            type: 'error',
            message: `Page ${relativePath} should define metadata for SEO`,
            filePath: pagePath,
            line: 1,
            code: 'NEXTJS15_PAGE_MISSING_METADATA',
            framework: 'nextjs',
            fix: {
                type: 'complex',
                transformer: 'addMetadataExport',
                context: {
                    title: path.basename(path.dirname(pagePath)).replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: `Description for ${path.basename(path.dirname(pagePath))} page`,
                }
            },
            documentation: 'https://nextjs.org/docs/app/building-your-application/optimizing/metadata',
        });
    }
    return issues;
}
/**
 * Validates route handlers
 */
async function validateRouteHandlers(context) {
    const issues = [];
    console.log('Checking route handlers implementation...');
    const appDirPath = path.join(context.rootDir, 'src', 'app');
    const hasAppDirectory = await (0, fs_1.directoryExists)(appDirPath);
    if (!hasAppDirectory) {
        return issues; // Skip if app directory doesn't exist
    }
    // Check for API route handlers
    const apiFiles = await (0, fs_1.getFilesWithExtension)(appDirPath, ['.ts', '.tsx']);
    const routeHandlers = apiFiles.filter(file => {
        const basename = path.basename(file);
        const dirname = path.dirname(file);
        return basename === 'route.ts' || basename === 'route.tsx' || dirname.endsWith('/api');
    });
    // Validate each route handler
    for (const routePath of routeHandlers) {
        const content = await (0, ast_1.parseFile)(routePath);
        // Check for proper exports (GET, POST, etc.)
        if (!content.content.includes('export async function GET') &&
            !content.content.includes('export async function POST') &&
            !content.content.includes('export async function PUT') &&
            !content.content.includes('export async function DELETE')) {
            issues.push({
                type: 'error',
                message: 'Route handler missing proper HTTP method exports',
                filePath: routePath,
                line: 0,
                code: 'NEXTJS15_INVALID_ROUTE_HANDLER',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'addRouteHandlerMethod',
                    context: {
                        method: 'GET', // Default method to add
                    }
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/routing/route-handlers',
            });
        }
        // Check for NextResponse usage
        if (!content.content.includes('NextResponse')) {
            issues.push({
                type: 'warning',
                message: 'Route handler should use NextResponse for better type safety',
                filePath: routePath,
                line: 0,
                code: 'NEXTJS15_MISSING_NEXT_RESPONSE',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'addNextResponseImport',
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/routing/route-handlers#response',
            });
        }
    }
    return issues;
}
/**
 * Validates data fetching patterns
 */
async function validateDataFetching(context) {
    const issues = [];
    console.log('Checking data fetching patterns...');
    // Get all component and page files
    const srcPath = path.join(context.rootDir, 'src');
    const allFiles = await (0, fs_1.getFilesWithExtension)(srcPath, ['.tsx', '.jsx', '.ts']);
    // Skip test files
    const tsxFiles = allFiles.filter(file => !file.includes('.test.') && !file.includes('.spec.'));
    for (const filePath of tsxFiles) {
        const content = await (0, ast_1.parseFile)(filePath);
        // Check for axios usage (prefer native fetch)
        if (content.content.includes('axios.')) {
            issues.push({
                type: 'warning',
                message: 'Using axios instead of native fetch for data fetching',
                filePath,
                line: 0,
                code: 'NEXTJS15_USING_AXIOS',
                framework: 'nextjs',
                fix: {
                    type: 'manual',
                    description: 'Replace axios with native fetch',
                    steps: [
                        'Replace axios.get(url) with fetch(url)',
                        'Replace axios.post(url, data) with fetch(url, { method: "POST", body: JSON.stringify(data) })',
                        'Handle response parsing: const data = await response.json()'
                    ]
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/data-fetching',
            });
        }
        // Check for SWR without cache configuration
        if (content.content.includes('useSWR(') && !content.content.includes('revalidate')) {
            issues.push({
                type: 'suggestion',
                message: 'SWR hook without revalidation configuration',
                filePath,
                line: 0,
                code: 'NEXTJS15_SWR_NO_REVALIDATION',
                framework: 'nextjs',
                fix: {
                    type: 'manual',
                    description: 'Add revalidation options to SWR hook',
                    steps: [
                        'Add revalidation options: useSWR(key, fetcher, { revalidateOnFocus: true, revalidateOnReconnect: true })'
                    ]
                },
                documentation: 'https://swr.vercel.app/docs/revalidation',
            });
        }
        // Check for getServerSideProps or getStaticProps in Pages Router
        if (content.content.includes('export async function getServerSideProps') ||
            content.content.includes('export async function getStaticProps')) {
            issues.push({
                type: 'error',
                message: 'Using Pages Router data fetching methods instead of App Router patterns',
                filePath,
                line: 0,
                code: 'NEXTJS15_LEGACY_DATA_FETCHING',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'migrateToAppRouterDataFetching',
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#step-4-migrating-data-fetching-methods',
            });
        }
    }
    return issues;
}
/**
 * Validates next.config.js
 */
async function validateNextConfig(context) {
    const issues = [];
    console.log('Checking Next.js configuration...');
    const configPath = path.join(context.rootDir, 'next.config.js');
    const configExists = await (0, fs_1.fileExists)(configPath);
    if (!configExists) {
        issues.push({
            type: 'error',
            message: 'Missing next.config.js file',
            filePath: context.rootDir,
            line: 0,
            code: 'NEXTJS15_MISSING_CONFIG',
            framework: 'nextjs',
            fix: {
                type: 'create_file',
                path: configPath,
                content: `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
        `.trim(),
            },
            documentation: 'https://nextjs.org/docs/app/api-reference/next-config-js',
        });
        return issues;
    }
    // Check configuration content
    const configContent = await (0, ast_1.parseFile)(configPath);
    // Check for necessary experimental features
    if (!configContent.content.includes('serverActions') || !configContent.content.includes('true')) {
        issues.push({
            type: 'warning',
            message: 'Server Actions not enabled in next.config.js',
            filePath: configPath,
            line: 0,
            code: 'NEXTJS15_SERVER_ACTIONS_DISABLED',
            framework: 'nextjs',
            fix: {
                type: 'complex',
                transformer: 'enableServerActions',
            },
            documentation: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions',
        });
    }
    // Check for outdated plugins or optimizations
    if (configContent.content.includes('webpack(config)') && configContent.content.includes('optimization')) {
        issues.push({
            type: 'suggestion',
            message: 'Manual webpack optimizations may conflict with Next.js defaults',
            filePath: configPath,
            line: 0,
            code: 'NEXTJS15_MANUAL_WEBPACK_CONFIG',
            framework: 'nextjs',
            fix: {
                type: 'manual',
                description: 'Review webpack configuration',
                steps: [
                    'Review webpack configuration for compatibility with Next.js 15',
                    'Consider using SWC optimizations instead of manual webpack config'
                ]
            },
            documentation: 'https://nextjs.org/docs/app/api-reference/next-config-js/webpack',
        });
    }
    return issues;
}
/**
 * Validates middleware implementation
 */
async function validateMiddleware(context) {
    const issues = [];
    console.log('Checking middleware implementation...');
    const middlewarePath = path.join(context.rootDir, 'src', 'middleware.ts');
    const middlewareExists = await (0, fs_1.fileExists)(middlewarePath);
    if (!middlewareExists) {
        return issues; // Middleware is optional
    }
    const content = await (0, ast_1.parseFile)(middlewarePath);
    // Check for export config
    if (!content.content.includes('export const config')) {
        issues.push({
            type: 'warning',
            message: 'Middleware missing config export with matcher',
            filePath: middlewarePath,
            line: 0,
            code: 'NEXTJS15_MIDDLEWARE_NO_CONFIG',
            framework: 'nextjs',
            fix: {
                type: 'complex',
                transformer: 'addMiddlewareConfig',
            },
            documentation: 'https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher',
        });
    }
    // Check for middleware function export
    if (!content.content.includes('export function middleware') && !content.content.includes('export default function')) {
        issues.push({
            type: 'error',
            message: 'Middleware missing proper function export',
            filePath: middlewarePath,
            line: 0,
            code: 'NEXTJS15_INVALID_MIDDLEWARE',
            framework: 'nextjs',
            fix: {
                type: 'complex',
                transformer: 'addMiddlewareFunction',
            },
            documentation: 'https://nextjs.org/docs/app/building-your-application/routing/middleware',
        });
    }
    // Check for NextResponse import
    if (!content.content.includes('NextResponse')) {
        issues.push({
            type: 'warning',
            message: 'Middleware should use NextResponse',
            filePath: middlewarePath,
            line: 0,
            code: 'NEXTJS15_MIDDLEWARE_NO_NEXT_RESPONSE',
            framework: 'nextjs',
            fix: {
                type: 'complex',
                transformer: 'addNextResponseImport',
            },
            documentation: 'https://nextjs.org/docs/app/building-your-application/routing/middleware#nextresponse',
        });
    }
    return issues;
}
/**
 * Validates async layout APIs
 */
async function validateAsyncLayoutAPIs(context) {
    const issues = [];
    console.log('Checking async layout APIs...');
    const appDirPath = path.join(context.rootDir, 'src', 'app');
    const hasAppDirectory = await (0, fs_1.directoryExists)(appDirPath);
    if (!hasAppDirectory) {
        return issues; // Skip if app directory doesn't exist
    }
    // Get all layout files
    const layoutFiles = await (0, fs_1.getFilesWithExtension)(appDirPath, ['.tsx']);
    const layouts = layoutFiles.filter(file => path.basename(file) === 'layout.tsx');
    for (const layoutPath of layouts) {
        const sourceFile = context.project.getSourceFile(layoutPath);
        if (!sourceFile)
            continue;
        // Find functions that use cookies() or headers() but aren't async
        const functions = sourceFile.getFunctions();
        for (const func of functions) {
            const isAsync = func.isAsync();
            const functionText = func.getText();
            // Check if the function uses cookies() or headers()
            const usesCookiesOrHeaders = functionText.includes('cookies()') ||
                functionText.includes('headers()');
            if (usesCookiesOrHeaders && !isAsync) {
                // Get function name for better error message
                const funcName = func.getName() || 'layout function';
                issues.push({
                    type: 'error',
                    message: `${funcName} using cookies() or headers() must be async`,
                    filePath: layoutPath,
                    line: func.getStartLineNumber(),
                    code: 'NEXTJS15_SYNC_LAYOUT_API',
                    framework: 'nextjs',
                    fix: {
                        type: 'complex',
                        transformer: 'makeLayoutFunctionAsync',
                        context: {
                            functionName: func.getName() || '',
                            startLine: func.getStartLineNumber(),
                            endLine: func.getEndLineNumber()
                        }
                    },
                    documentation: 'https://nextjs.org/docs/app/api-reference/functions/cookies',
                });
            }
            // Check for proper typing with Promise
            if (isAsync) {
                const returnType = func.getReturnType();
                const returnTypeText = returnType.getText();
                if (usesCookiesOrHeaders && !returnTypeText.includes('Promise')) {
                    issues.push({
                        type: 'warning',
                        message: 'Async layout function should have Promise return type',
                        filePath: layoutPath,
                        line: func.getStartLineNumber(),
                        code: 'NEXTJS15_MISSING_PROMISE_TYPE',
                        framework: 'nextjs',
                        fix: {
                            type: 'complex',
                            transformer: 'addPromiseReturnType',
                            context: {
                                functionName: func.getName() || '',
                                startLine: func.getStartLineNumber()
                            }
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts',
                    });
                }
            }
        }
    }
    return issues;
}
/**
 * Validates dynamic route segments
 */
async function validateDynamicRouteSegments(context) {
    const issues = [];
    console.log('Checking dynamic route segments...');
    const appDirPath = path.join(context.rootDir, 'src', 'app');
    const hasAppDirectory = await (0, fs_1.directoryExists)(appDirPath);
    if (!hasAppDirectory) {
        return issues; // Skip if app directory doesn't exist
    }
    // Walk the app directory to find route segments
    async function walkAppDir(dir) {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const segmentName = entry.name;
                const fullPath = path.join(dir, segmentName);
                // Check for proper naming of dynamic segments
                if ((segmentName.startsWith('[') && !segmentName.endsWith(']')) ||
                    (segmentName.endsWith(']') && !segmentName.startsWith('['))) {
                    issues.push({
                        type: 'error',
                        message: `Malformed dynamic route segment: ${segmentName}`,
                        filePath: fullPath,
                        line: 0,
                        code: 'NEXTJS15_MALFORMED_DYNAMIC_SEGMENT',
                        framework: 'nextjs',
                        fix: {
                            type: 'rename_directory',
                            oldPath: fullPath,
                            newPath: path.join(dir, segmentName.startsWith('[')
                                ? `[${segmentName.slice(1)}]`
                                : `[${segmentName.slice(0, -1)}]`)
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes',
                    });
                }
                // Check proper usage of route groups
                if ((segmentName.startsWith('(') && !segmentName.endsWith(')')) ||
                    (segmentName.endsWith(')') && !segmentName.startsWith('('))) {
                    issues.push({
                        type: 'error',
                        message: `Malformed route group: ${segmentName}`,
                        filePath: fullPath,
                        line: 0,
                        code: 'NEXTJS15_MALFORMED_ROUTE_GROUP',
                        framework: 'nextjs',
                        fix: {
                            type: 'rename_directory',
                            oldPath: fullPath,
                            newPath: path.join(dir, segmentName.startsWith('(')
                                ? `(${segmentName.slice(1)})`
                                : `(${segmentName.slice(0, -1)})`)
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/routing/route-groups',
                    });
                }
                // Check for optional catch-all syntax
                if (segmentName.includes('[[') && (!segmentName.includes(']]') || segmentName.indexOf(']]') !== segmentName.length - 2)) {
                    issues.push({
                        type: 'error',
                        message: `Malformed optional catch-all route: ${segmentName}`,
                        filePath: fullPath,
                        line: 0,
                        code: 'NEXTJS15_MALFORMED_OPTIONAL_CATCH_ALL',
                        framework: 'nextjs',
                        fix: {
                            type: 'rename_directory',
                            oldPath: fullPath,
                            newPath: path.join(dir, `[[...${segmentName.replace(/[\[\]]/g, '')}]]`)
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#optional-catch-all-segments',
                    });
                }
                // Check for catch-all syntax
                if (segmentName.includes('[...') && (!segmentName.includes(']') || segmentName.indexOf(']') !== segmentName.length - 1)) {
                    issues.push({
                        type: 'error',
                        message: `Malformed catch-all route: ${segmentName}`,
                        filePath: fullPath,
                        line: 0,
                        code: 'NEXTJS15_MALFORMED_CATCH_ALL',
                        framework: 'nextjs',
                        fix: {
                            type: 'rename_directory',
                            oldPath: fullPath,
                            newPath: path.join(dir, `[...${segmentName.replace(/[\[\]\.]/g, '')}]`)
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#catch-all-segments',
                    });
                }
                // Continue walking
                await walkAppDir(fullPath);
            }
        }
    }
    await walkAppDir(appDirPath);
    return issues;
}
/**
 * Validates generateStaticParams typing
 */
async function validateGenerateStaticParams(context) {
    const issues = [];
    console.log('Checking generateStaticParams typing...');
    const appDirPath = path.join(context.rootDir, 'src', 'app');
    const hasAppDirectory = await (0, fs_1.directoryExists)(appDirPath);
    if (!hasAppDirectory) {
        return issues; // Skip if app directory doesn't exist
    }
    // Get all page/layout files in dynamic route segments
    const tsxFiles = await (0, fs_1.getFilesWithExtension)(appDirPath, ['.tsx']);
    const dynamicRouteFiles = tsxFiles.filter(file => {
        const dirName = path.basename(path.dirname(file));
        return (dirName.startsWith('[') || dirName.includes('[...')) &&
            (path.basename(file) === 'page.tsx' || path.basename(file) === 'layout.tsx');
    });
    for (const filePath of dynamicRouteFiles) {
        const sourceFile = context.project.getSourceFile(filePath);
        if (!sourceFile)
            continue;
        // Check for generateStaticParams function
        const staticParamsFunc = sourceFile.getFunction('generateStaticParams');
        if (!staticParamsFunc) {
            // Only suggest for page files, not layout files
            if (path.basename(filePath) === 'page.tsx') {
                issues.push({
                    type: 'suggestion',
                    message: 'Dynamic route segment page should implement generateStaticParams',
                    filePath,
                    line: 0,
                    code: 'NEXTJS15_MISSING_GENERATE_STATIC_PARAMS',
                    framework: 'nextjs',
                    fix: {
                        type: 'complex',
                        transformer: 'addGenerateStaticParams',
                        context: {
                            paramName: path.basename(path.dirname(filePath)).replace(/[\[\]\.\.]/g, '')
                        }
                    },
                    documentation: 'https://nextjs.org/docs/app/api-reference/functions/generate-static-params',
                });
            }
            continue;
        }
        // Check if function is async
        const isAsync = staticParamsFunc.isAsync();
        if (!isAsync) {
            issues.push({
                type: 'warning',
                message: 'generateStaticParams should be async for better performance',
                filePath,
                line: staticParamsFunc.getStartLineNumber(),
                code: 'NEXTJS15_SYNC_GENERATE_STATIC_PARAMS',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'makeGenerateStaticParamsAsync',
                    context: {
                        startLine: staticParamsFunc.getStartLineNumber()
                    }
                },
                documentation: 'https://nextjs.org/docs/app/api-reference/functions/generate-static-params',
            });
        }
        // Check return type
        const returnType = staticParamsFunc.getReturnType();
        const returnTypeText = returnType.getText();
        if (!returnTypeText.includes('Promise<') || !returnTypeText.includes('[]')) {
            issues.push({
                type: 'error',
                message: 'generateStaticParams should return Promise<...[]>',
                filePath,
                line: staticParamsFunc.getStartLineNumber(),
                code: 'NEXTJS15_INCORRECT_STATIC_PARAMS_RETURN_TYPE',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'fixGenerateStaticParamsReturnType',
                    context: {
                        paramName: path.basename(path.dirname(filePath)).replace(/[\[\]\.\.]/g, ''),
                        startLine: staticParamsFunc.getStartLineNumber()
                    }
                },
                documentation: 'https://nextjs.org/docs/app/api-reference/functions/generate-static-params',
            });
        }
    }
    return issues;
}
/**
 * Validates legacy API usage in App Router
 */
async function validateLegacyApiInAppRouter(context) {
    const issues = [];
    console.log('Checking for legacy API usage in App Router...');
    const appDirPath = path.join(context.rootDir, 'src', 'app');
    const hasAppDirectory = await (0, fs_1.directoryExists)(appDirPath);
    if (!hasAppDirectory) {
        return issues; // Skip if app directory doesn't exist
    }
    // Get all component files
    const tsxFiles = await (0, fs_1.getFilesWithExtension)(appDirPath, ['.tsx']);
    for (const filePath of tsxFiles) {
        const sourceFile = context.project.getSourceFile(filePath);
        if (!sourceFile)
            continue;
        // Check for getServerSideProps
        const getServerSideProps = sourceFile.getFunction('getServerSideProps');
        if (getServerSideProps) {
            issues.push({
                type: 'error',
                message: 'getServerSideProps is not supported in App Router',
                filePath,
                line: getServerSideProps.getStartLineNumber(),
                code: 'NEXTJS15_APP_ROUTER_GET_SERVER_SIDE_PROPS',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'migrateGetServerSideProps',
                    context: {
                        startLine: getServerSideProps.getStartLineNumber(),
                        endLine: getServerSideProps.getEndLineNumber()
                    }
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#step-4-migrating-data-fetching-methods',
            });
        }
        // Check for getStaticProps
        const getStaticProps = sourceFile.getFunction('getStaticProps');
        if (getStaticProps) {
            issues.push({
                type: 'error',
                message: 'getStaticProps is not supported in App Router',
                filePath,
                line: getStaticProps.getStartLineNumber(),
                code: 'NEXTJS15_APP_ROUTER_GET_STATIC_PROPS',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'migrateGetStaticProps',
                    context: {
                        startLine: getStaticProps.getStartLineNumber(),
                        endLine: getStaticProps.getEndLineNumber()
                    }
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#step-4-migrating-data-fetching-methods',
            });
        }
        // Check for getStaticPaths
        const getStaticPaths = sourceFile.getFunction('getStaticPaths');
        if (getStaticPaths) {
            issues.push({
                type: 'error',
                message: 'getStaticPaths is not supported in App Router - use generateStaticParams instead',
                filePath,
                line: getStaticPaths.getStartLineNumber(),
                code: 'NEXTJS15_APP_ROUTER_GET_STATIC_PATHS',
                framework: 'nextjs',
                fix: {
                    type: 'complex',
                    transformer: 'migrateGetStaticPaths',
                    context: {
                        startLine: getStaticPaths.getStartLineNumber(),
                        endLine: getStaticPaths.getEndLineNumber()
                    }
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#step-4-migrating-data-fetching-methods',
            });
        }
        // Check for getInitialProps
        const hasGetInitialProps = sourceFile.getText().includes('.getInitialProps');
        if (hasGetInitialProps) {
            // Find the exact line number
            const lines = sourceFile.getText().split('\n');
            const lineIndex = lines.findIndex(line => line.includes('.getInitialProps'));
            issues.push({
                type: 'error',
                message: 'getInitialProps is not supported in App Router',
                filePath,
                line: lineIndex >= 0 ? lineIndex + 1 : 0,
                code: 'NEXTJS15_APP_ROUTER_GET_INITIAL_PROPS',
                framework: 'nextjs',
                fix: {
                    type: 'manual',
                    description: 'Migrate getInitialProps to App Router pattern',
                    steps: [
                        'Remove getInitialProps usage',
                        'Use React Server Components to fetch data',
                        'Or use "use client" directive with useState + useEffect for client-side data fetching'
                    ]
                },
                documentation: 'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#step-4-migrating-data-fetching-methods',
            });
        }
    }
    return issues;
}
/**
 * Validates image optimization
 */
async function validateImageOptimization(context) {
    const issues = [];
    console.log('Checking image optimization...');
    // Get all component files
    const srcPath = path.join(context.rootDir, 'src');
    const tsxFiles = await (0, fs_1.getFilesWithExtension)(srcPath, ['.tsx', '.jsx']);
    for (const filePath of tsxFiles) {
        // Skip test files
        if (filePath.includes('.test.') || filePath.includes('.spec.')) {
            continue;
        }
        const sourceFile = context.project.getSourceFile(filePath);
        if (!sourceFile)
            continue;
        // Check for <img> tags
        const jsxElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxSelfClosingElement);
        const jsxOpeningElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxOpeningElement);
        // Handle self-closing img tags
        for (const element of jsxElements) {
            const tagName = element.getTagNameNode().getText();
            if (tagName === 'img') {
                // Check if already using next/image
                const hasNextImageImport = sourceFile.getImportDeclarations().some(importDecl => importDecl.getModuleSpecifierValue() === 'next/image');
                if (!hasNextImageImport) {
                    issues.push({
                        type: 'warning',
                        message: 'Use next/image Image component instead of <img> tag',
                        filePath,
                        line: element.getStartLineNumber(),
                        code: 'NEXTJS15_IMG_TAG',
                        framework: 'nextjs',
                        fix: {
                            type: 'complex',
                            transformer: 'convertToNextImage',
                            context: {
                                isSelfClosing: true,
                                startLine: element.getStartLineNumber()
                            }
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/optimizing/images',
                    });
                }
            }
        }
        // Handle non-self-closing img tags
        for (const element of jsxOpeningElements) {
            const tagName = element.getTagNameNode().getText();
            if (tagName === 'img') {
                // Check if already using next/image
                const hasNextImageImport = sourceFile.getImportDeclarations().some(importDecl => importDecl.getModuleSpecifierValue() === 'next/image');
                if (!hasNextImageImport) {
                    issues.push({
                        type: 'warning',
                        message: 'Use next/image Image component instead of <img> tag',
                        filePath,
                        line: element.getStartLineNumber(),
                        code: 'NEXTJS15_IMG_TAG',
                        framework: 'nextjs',
                        fix: {
                            type: 'complex',
                            transformer: 'convertToNextImage',
                            context: {
                                isSelfClosing: false,
                                startLine: element.getStartLineNumber()
                            }
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/optimizing/images',
                    });
                }
            }
        }
    }
    return issues;
}
