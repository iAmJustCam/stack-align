#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script to test the cleanDirectories function
 */
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = require("../utils/fs");
const rootDir = path_1.default.resolve(__dirname, '../../');
const testDir = path_1.default.join(rootDir, 'test-clean-directory');
const nestedDir = path_1.default.join(testDir, 'nested');
async function main() {
    // Create test directories
    console.log('Creating test directories...');
    await promises_1.default.mkdir(testDir, { recursive: true });
    await promises_1.default.mkdir(nestedDir, { recursive: true });
    // Create some test files
    await promises_1.default.writeFile(path_1.default.join(testDir, 'test1.txt'), 'Test content 1');
    await promises_1.default.writeFile(path_1.default.join(nestedDir, 'test2.txt'), 'Test content 2');
    console.log('Test directories and files created.');
    // List the created structure
    const files = await promises_1.default.readdir(testDir, { recursive: true });
    console.log('Created files:', files);
    // Test the cleanDirectories function
    console.log('\nTesting cleanDirectories function...');
    await (0, fs_1.cleanDirectories)(testDir, { verbose: true });
    // Verify the directory is gone
    try {
        await promises_1.default.access(testDir);
        console.log('❌ Test failed: Directory still exists!');
    }
    catch (error) {
        console.log('✅ Test passed: Directory was successfully removed!');
    }
}
// Run the test
main()
    .then(() => console.log('Clean test completed successfully'))
    .catch(error => {
    console.error('Error during test:', error);
    process.exit(1);
});
