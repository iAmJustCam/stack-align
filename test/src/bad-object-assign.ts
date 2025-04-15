function createContentWithMethods(content: string) {
  // Incorrect: No type assertion on Object.assign
  const contentObject = Object.assign(content, {
    includes: function(text: string) {
      return content.includes(text);
    },
    getLines: function() {
      return content.split('\n');
    }
  });
  
  return contentObject;
}

function extendConfig(config: Record<string, unknown>) {
  // Incorrect: No type assertion on Object.assign
  const extendedConfig = Object.assign(config, {
    validate: function() {
      return true;
    }
  });
  
  return extendedConfig;
}

export { createContentWithMethods, extendConfig };