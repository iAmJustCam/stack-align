#!/usr/bin/env node

/**
 * Clean script using native fs.rm
 * Can be invoked with `ts-node src/scripts/clean.ts` or through package.json script
 */
import * as path from 'path';
import { cleanDirectories } from '../utils/fs';

const rootDir = path.resolve(__dirname, '../../');

async function main() {
  // Directories to clean
  const dirsToClean = [
    path.join(rootDir, 'dist'),
    path.join(rootDir, 'coverage')
  ];
  
  // Print banner
  console.log('🧹 Cleaning project directories...');
  
  // Clean with verbose logging
  await cleanDirectories(dirsToClean, { verbose: true });
  
  console.log('✨ Project cleaned successfully!');
}

// Run the clean process
main().catch(error => {
  console.error('Error cleaning directories:', error);
  process.exit(1);
});