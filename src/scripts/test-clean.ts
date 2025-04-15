#!/usr/bin/env node

/**
 * Script to test the cleanDirectories function
 */
import path from 'path';
import fs from 'fs/promises';
import { cleanDirectories } from '../utils/fs';

const rootDir = path.resolve(__dirname, '../../');
const testDir = path.join(rootDir, 'test-clean-directory');
const nestedDir = path.join(testDir, 'nested');

async function main() {
  // Create test directories
  console.log('Creating test directories...');
  await fs.mkdir(testDir, { recursive: true });
  await fs.mkdir(nestedDir, { recursive: true });
  
  // Create some test files
  await fs.writeFile(path.join(testDir, 'test1.txt'), 'Test content 1');
  await fs.writeFile(path.join(nestedDir, 'test2.txt'), 'Test content 2');
  
  console.log('Test directories and files created.');
  
  // List the created structure
  const files = await fs.readdir(testDir, { recursive: true });
  console.log('Created files:', files);
  
  // Test the cleanDirectories function
  console.log('\nTesting cleanDirectories function...');
  await cleanDirectories(testDir, { verbose: true });
  
  // Verify the directory is gone
  try {
    await fs.access(testDir);
    console.log('❌ Test failed: Directory still exists!');
  } catch (error) {
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