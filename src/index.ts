// Main exports for the Tech Stack Alignment System
import { analyzeProjectTopDown } from './core/top-down-analyzer';
import { healComponent } from './healers/component-healer';
import { healProject } from './healers/healing-engine';
import { generateTests, generateTestForComponent } from './healers/test-generation-engine';
import {
  validateArchitecture,
} from './validators/architecture-validator';
import {
  validateNextJs15Implementation,
} from './validators/nextjs15-validator';
import { 
  validateReact19Implementation,
} from './validators/react19-validator';
import {
  validateTailwindV4Implementation,
} from './validators/tailwindv4-validator';
import {
  validateTypeScript5Implementation,
} from './validators/typescript5-validator';
import {
  validateVitestImplementation,
} from './validators/vitest-validator';

// Export public API
export {
  // Core analyzer
  analyzeProjectTopDown,
  
  // Validators
  validateArchitecture,
  validateNextJs15Implementation,
  validateReact19Implementation,
  validateTailwindV4Implementation,
  validateTypeScript5Implementation,
  validateVitestImplementation,
  
  // Healers
  healComponent,
  healProject,
  
  // Test generators
  generateTests,
  generateTestForComponent,
};

// Export types
export * from './types';