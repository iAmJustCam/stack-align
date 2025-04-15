function extractComponents(content: string, pattern: any, options: any) {
  // Incorrect: No type checking for RegExp parameters
  const regex = new RegExp(pattern, options);
  
  const matches = content.match(regex);
  return matches || [];
}

function replaceInContent(content: string, pattern: any, replacement: any) {
  // Incorrect: No type checking for RegExp parameters
  const regex = new RegExp(pattern);
  
  return content.replace(regex, replacement);
}

export { extractComponents, replaceInContent };