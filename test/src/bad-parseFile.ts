import * as fs from '../../src/utils/fs';

// Alias the function directly to match our detector pattern
const parseFile = fs.parseFile;

async function checkConfigFile(filePath: string): Promise<boolean> {
  const content = await parseFile(filePath);
  
  // Incorrect: Using includes directly on the result of parseFile
  if (content.includes('serverActions') && content.includes('true')) {
    return true;
  }
  
  return false;
}

async function findImports(filePath: string): Promise<string[]> {
  const content = await parseFile(filePath);
  const importLines = content.toString().split('\n').filter(line => line.includes('import '));
  return importLines;
}

export { checkConfigFile, findImports };