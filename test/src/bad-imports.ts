// Example of incorrect Node.js imports
import path from 'path';
import fs from 'fs';
import util from 'util';

async function readDir(dirPath: string) {
  try {
    const files = await fs.promises.readdir(dirPath);
    return files;
  } catch (error) {
    console.error(`Error reading ${dirPath}:`, error);
    return [];
  }
}

async function getAbsolutePath(relativePath: string) {
  return path.resolve(process.cwd(), relativePath);
}

export { readDir, getAbsolutePath };