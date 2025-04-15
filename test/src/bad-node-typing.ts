import { Project, SyntaxKind } from 'ts-morph';

function analyzeComponentProps(filePath: string) {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);
  
  const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
  
  const propTypes = [];
  
  for (const attr of jsxAttributes) {
    // Incorrect: Using instance method instead of static method
    if (attr.isJsxAttribute()) {
      const name = attr.getNameNode().getText();
      propTypes.push(name);
    }
  }
  
  const variableDeclarations = sourceFile.getVariableDeclarations();
  
  for (const varDecl of variableDeclarations) {
    // Incorrect: Using instance method instead of static method
    if (varDecl.isArrowFunction()) {
      console.log('Found arrow function component');
    }
  }
  
  return propTypes;
}

export { analyzeComponentProps };