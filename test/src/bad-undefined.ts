interface Context {
  rootDir?: string;
  component?: {
    name?: string;
    props?: string[];
  };
}

function processComponent(context: Context): { name?: string; propCount?: number } {
  // Incorrect: Not checking if component is defined
  const componentName = context.component.name;
  
  // Incorrect: Not checking if props is defined
  const propCount = context.component.props.length;
  
  return {
    name: componentName,
    propCount
  };
}

function getComponentPath(context: Context, fileName: string) {
  // Incorrect: Not checking if rootDir is defined
  return context.rootDir + '/components/' + fileName;
}

export { processComponent, getComponentPath };