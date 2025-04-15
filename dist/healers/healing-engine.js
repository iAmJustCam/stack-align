"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healProject = healProject;
const component_healer_1 = require("./component-healer");
const test_generation_engine_1 = require("./test-generation-engine");
const project_scanner_1 = require("../utils/project-scanner");
const path_1 = __importDefault(require("path"));
/**
 * Heals a project based on analysis results
 *
 * @param context Project context
 * @param results Analysis results containing issues
 * @param options Healing options
 * @returns Healing report detailing all operations performed
 */
async function healProject(context, results, options = {}) {
    var _a, _b, _c, _d, _e;
    const operations = [];
    const startTime = Date.now();
    // Collect all issues from the analysis results
    const allIssues = collectIssues(results);
    // Filter issues based on options
    const filteredIssues = filterIssues(allIssues, options);
    // Apply maxFix limit if specified
    const maxFixLimit = options.maxFix || ((_a = options.healing) === null || _a === void 0 ? void 0 : _a.maxFix);
    let issuesToHeal = filteredIssues;
    if (maxFixLimit && maxFixLimit > 0 && filteredIssues.length > maxFixLimit) {
        issuesToHeal = filteredIssues.slice(0, maxFixLimit);
        console.log(`Limiting to ${maxFixLimit} fixes out of ${filteredIssues.length} total issues`);
    }
    else {
        console.log(`Found ${filteredIssues.length} issues to heal`);
    }
    // Group issues by file path for more efficient healing
    const issuesByFilePath = groupIssuesByFile(issuesToHeal);
    // Scan the project to get component files
    const scanResult = await (0, project_scanner_1.scanProject)(context);
    // Process each file with its issues
    for (const [filePath, issues] of Object.entries(issuesByFilePath)) {
        // Skip files that don't exist
        if (!context.project.getSourceFile(filePath)) {
            if (scanResult.componentFiles.includes(filePath)) {
                console.log(`Healing component: ${path_1.default.basename(filePath)}`);
                try {
                    // Heal the component
                    const healingResult = await (0, component_healer_1.healComponent)(filePath, issues, {
                        dryRun: options.dryRun,
                        generateTests: options.generateTests,
                        migrateToTypeScript: (_b = options.healing) === null || _b === void 0 ? void 0 : _b.migrateLegacyCode,
                        moveToSrc: (_c = options.healing) === null || _c === void 0 ? void 0 : _c.migrateLegacyCode,
                    });
                    // Add operations to the report
                    operations.push(...healingResult.operations);
                }
                catch (error) {
                    console.error(`Error healing ${filePath}:`, error);
                }
            }
        }
    }
    // Generate missing tests if requested and none were generated during healing
    if (options.generateTests &&
        !operations.some(op => op.type === 'test_generation') &&
        !options.dryRun) {
        // Generate tests for components that don't have them
        const testGenerationOptions = {
            coverageThreshold: ((_d = options.testing) === null || _d === void 0 ? void 0 : _d.coverage) || 80,
            includeA11y: ((_e = options.testing) === null || _e === void 0 ? void 0 : _e.includeA11y) || false,
        };
        try {
            const testResults = await (0, test_generation_engine_1.generateTests)(context, testGenerationOptions);
            operations.push(...testResults.operations);
        }
        catch (error) {
            console.error('Error generating tests:', error);
        }
    }
    const endTime = Date.now();
    // Additional stats for the report
    const wasLimited = maxFixLimit && maxFixLimit > 0 && filteredIssues.length > maxFixLimit;
    return {
        startTime,
        endTime,
        operations,
        success: true,
        stats: {
            totalIssues: filteredIssues.length,
            fixedIssues: operations.length,
            limitApplied: wasLimited ? true : undefined,
            remainingIssues: wasLimited && maxFixLimit ? filteredIssues.length - maxFixLimit : undefined,
            fixLimit: maxFixLimit || undefined,
        }
    };
}
/**
 * Collects all issues from analysis results
 */
function collectIssues(results) {
    const issues = [];
    // Project issues
    issues.push(...results.project.issues);
    // Framework issues
    Object.values(results.frameworks).forEach(framework => {
        issues.push(...framework.issues);
    });
    // Component issues
    issues.push(...results.components.issues);
    // Page issues
    issues.push(...results.pages.issues);
    // Hook issues
    issues.push(...results.hooks.issues);
    // Utility issues
    issues.push(...results.utilities.issues);
    return issues;
}
/**
 * Filters issues based on healing options
 */
function filterIssues(issues, options) {
    let filtered = [...issues];
    // Filter by framework if specified
    if (options.filter) {
        filtered = filtered.filter(issue => {
            // Match on framework
            return issue.framework === options.filter;
        });
    }
    // Filter by component if specified
    if (options.component) {
        filtered = filtered.filter(issue => {
            // Check if the issue has a component property matching the filter
            return issue.component === options.component;
        });
    }
    // Filter issues without fixes
    filtered = filtered.filter(issue => issue.fix);
    return filtered;
}
/**
 * Groups issues by file path
 */
function groupIssuesByFile(issues) {
    const result = {};
    for (const issue of issues) {
        if (issue.filePath) {
            if (!result[issue.filePath]) {
                result[issue.filePath] = [];
            }
            result[issue.filePath].push(issue);
        }
    }
    return result;
}
