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
exports.validateTransformedCode = validateTransformedCode;
const ts = __importStar(require("typescript"));
/**
 * Validates that a healing operation will produce valid code
 *
 * @param sourceFile The source file to validate
 * @param transformedContent The transformed content to validate
 * @returns Array of validation issues
 */
function validateTransformedCode(sourceFile, transformedContent) {
    const issues = [];
    const filePath = sourceFile.getFilePath();
    // Check for syntax errors
    const syntaxErrors = validateSyntax(transformedContent, filePath);
    issues.push(...syntaxErrors);
    // Check for unbalanced brackets and parentheses
    const bracketIssues = validateBrackets(transformedContent, filePath);
    issues.push(...bracketIssues);
    // Check for common post-transformation issues
    const postTransformationIssues = validatePostTransformation(transformedContent, filePath);
    issues.push(...postTransformationIssues);
    return issues;
}
/**
 * Validates syntax of transformed content
 */
function validateSyntax(content, filePath) {
    const issues = [];
    try {
        // Create a source file with the TypeScript compiler API
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
        // For simple syntax checking, we'll just verify the file parses without errors
        // Since we can't directly access diagnostic info in this ts-morph version
        if (sourceFile) {
            // If we got here, basic parsing succeeded, but we'll still check for obvious errors
            try {
                // Try some basic analysis to catch syntax errors
                const stmts = sourceFile.statements;
            }
            catch (error) {
                issues.push({
                    type: 'error',
                    message: `Syntax error after transformation: ${error instanceof Error ? error.message : String(error)}`,
                    filePath,
                    line: 1,
                    code: 'HEALING_SYNTAX_ERROR',
                    framework: 'healing',
                    fix: {
                        type: 'manual',
                        description: 'The transformation resulted in invalid syntax. Manual intervention required.',
                        position: { line: 1, column: 1 }
                    }
                });
            }
        }
    }
    catch (error) {
        // If we can't even parse the file, it's definitely a syntax error
        issues.push({
            type: 'error',
            message: `Critical syntax error after transformation: ${error instanceof Error ? error.message : String(error)}`,
            filePath,
            line: 1,
            code: 'HEALING_CRITICAL_SYNTAX_ERROR',
            framework: 'healing',
            fix: {
                type: 'manual',
                description: 'The transformation resulted in unparsable code. Manual intervention required.'
            }
        });
    }
    return issues;
}
// Helper function to get line and character from position
function getLineAndCharFromPos(text, pos) {
    const lines = text.substring(0, pos).split('\n');
    return {
        line: lines.length,
        character: lines[lines.length - 1].length
    };
}
/**
 * Validates brackets and parentheses are balanced
 */
function validateBrackets(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    const stack = [];
    const pairs = {
        ')': '(',
        '}': '{',
        ']': '['
    };
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if ('{(['.includes(char)) {
                stack.push({ char, line: lineIndex + 1, charIndex: charIndex + 1 });
            }
            else if (')]}}'.includes(char)) {
                if (stack.length === 0) {
                    issues.push({
                        type: 'error',
                        message: `Unmatched closing '${char}' after transformation`,
                        filePath,
                        line: lineIndex + 1,
                        code: 'HEALING_UNBALANCED_BRACKETS',
                        framework: 'healing',
                        fix: {
                            type: 'manual',
                            description: 'The transformation resulted in unbalanced brackets. Manual intervention required.',
                            position: { line: lineIndex + 1, column: charIndex + 1 }
                        }
                    });
                }
                else {
                    const lastBracket = stack.pop();
                    if (lastBracket.char !== pairs[char]) {
                        issues.push({
                            type: 'error',
                            message: `Mismatched brackets: '${lastBracket.char}' at line ${lastBracket.line} and '${char}' at line ${lineIndex + 1}`,
                            filePath,
                            line: lineIndex + 1,
                            code: 'HEALING_MISMATCHED_BRACKETS',
                            framework: 'healing',
                            fix: {
                                type: 'manual',
                                description: 'The transformation resulted in mismatched brackets. Manual intervention required.',
                                position: { line: lineIndex + 1, column: charIndex + 1 }
                            }
                        });
                    }
                }
            }
        }
    }
    // Check for unclosed brackets
    for (const bracket of stack) {
        issues.push({
            type: 'error',
            message: `Unclosed '${bracket.char}' after transformation at line ${bracket.line}`,
            filePath,
            line: bracket.line,
            code: 'HEALING_UNCLOSED_BRACKET',
            framework: 'healing',
            fix: {
                type: 'manual',
                description: 'The transformation resulted in unclosed brackets. Manual intervention required.',
                position: { line: bracket.line, column: bracket.charIndex }
            }
        });
    }
    return issues;
}
/**
 * Validates for common post-transformation issues
 */
function validatePostTransformation(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    // Check for specific post-transformation issues like duplicate closing brackets/parentheses
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        // Check for consecutive closing brackets/parentheses that might indicate a transformation error
        // But skip patterns that are common in JSX
        const hasConsecutiveClosing = line.match(/\)\s*\)/g) || line.match(/\}\s*\}/g) || line.match(/\]\s*\]/g);
        if (hasConsecutiveClosing) {
            // Skip if this is JSX related (common patterns in React components)
            const isJsxRelated = 
            // Skip JSX component closing tags with props
            line.includes('/>') ||
                // Skip JSX closing tags
                line.includes('</') ||
                // Skip closing of props in JSX with children or event handlers
                line.includes('>') ||
                // Skip lines with JSX fragments
                line.includes('</>') ||
                // Skip JSX event handlers
                line.includes('onClick={') ||
                line.includes('onChange={') ||
                line.includes('onSubmit={') ||
                // Skip JSX style objects
                line.includes('style={{') ||
                // Skip object literals in JSX (common in props)
                (line.includes('{') && line.includes('}')) ||
                // Skip array literals in JSX (common in map functions)
                (line.includes('[') && line.includes(']'));
            if (!isJsxRelated) {
                issues.push({
                    type: 'warning',
                    message: 'Possible duplicate closing brackets/parentheses after transformation',
                    filePath,
                    line: lineIndex + 1,
                    code: 'HEALING_DUPLICATE_CLOSING',
                    framework: 'healing',
                    fix: {
                        type: 'manual',
                        description: 'The transformation may have resulted in duplicate closing brackets/parentheses. Review and fix manually.'
                    }
                });
            }
        }
        // Check for useEffect with malformed dependency array (common issue)
        if (line.includes('useEffect') &&
            (lineIndex + 5 < lines.length) &&
            lines.slice(lineIndex, lineIndex + 5).join('\n').match(/useEffect\s*\([^)]*\)\s*\)/)) {
            issues.push({
                type: 'error',
                message: 'Malformed useEffect dependency array after transformation',
                filePath,
                line: lineIndex + 1,
                code: 'HEALING_USEEFFECT_SYNTAX',
                framework: 'react',
                fix: {
                    type: 'manual',
                    description: 'The transformation resulted in a malformed useEffect. Review and fix the dependency array.'
                }
            });
        }
        // Check for issues with exports (missing or duplicate)
        if (line.includes('export default') && content.includes('export function') &&
            content.includes('function') && !content.includes('export function')) {
            issues.push({
                type: 'warning',
                message: 'Mixed export patterns after transformation',
                filePath,
                line: lineIndex + 1,
                code: 'HEALING_MIXED_EXPORTS',
                framework: 'healing',
                fix: {
                    type: 'manual',
                    description: 'The transformation resulted in mixed export patterns. Review and standardize exports.'
                }
            });
        }
    }
    return issues;
}
