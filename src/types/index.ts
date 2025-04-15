/**
 * Barrel export file for types
 * Enables importing from '@/types' instead of deep paths
 */

// Game-related types
export * from "./game";

// Component-specific types
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Optional test ID for targeting in tests */
  "data-testid"?: string;
}

// UI-related types
export interface PremiumComponentProps extends BaseComponentProps {
  /** Visual variant of the component */
  variant?: "standard" | "featured" | "achievement";
  /** Educational context metadata */
  educationalContext?: {
    /** Whether the associated content is completed */
    completionStatus?: "not-started" | "in-progress" | "completed";
    /** Difficulty level */
    difficultyLevel?: "beginner" | "intermediate" | "advanced";
    /** Subject area */
    subject?: string;
  };
  /** Component children */
  children: React.ReactNode;
}

// Learning-related types
export interface LearningData {
  /** User progress data */
  progress: Record<string, unknown>;
  /** Skill mastery data */
  skillMastery: SkillMastery[];
  /** Learning recommendations */
  recommendations: LearningRecommendation[];
  /** Last update timestamp */
  lastUpdated: string;
}

export interface SkillMastery {
  /** Unique identifier for the skill */
  id: string;
  /** User ID */
  userId: string;
  /** Skill ID */
  skillId: string;
  /** Skill name */
  name: string;
  /** Mastery level (0-1) */
  level: number;
  /** Importance of the skill (1-10) */
  importance: number;
  /** Last practice date */
  lastPracticed: string;
}

export interface LearningRecommendation {
  /** Unique identifier */
  id: string;
  /** Type of recommendation */
  type: "activity" | "lesson" | "quiz";
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Targeted skill ID */
  skillTargeted: string;
  /** Skill name */
  skillName: string;
  /** Current skill level */
  currentSkillLevel: number;
  /** Estimated completion time in minutes */
  estimatedCompletionTime: number;
  /** Priority score */
  priority: number;
}

// System types
export interface ProjectContext {
  rootDir: string;
  project: import('ts-morph').Project;
  projectName: string;
  tsconfig?: {
    path: string;
    content: Record<string, unknown>;
  };
  packageJson?: {
    path: string;
    content: Record<string, unknown>;
  };
  stackAlignConfig?: {
    path: string;
    content: Record<string, unknown>;
  };
}

export interface ComponentContext {
  filePath: string;
  content: string;
  isComponent: boolean;
  componentName?: string;
  usesTypeScript: boolean;
  isArrowFunction?: boolean;
  isFunctionDeclaration?: boolean;
  usesReactFC?: boolean;
  hasPropInterface?: boolean;
  hasChildren?: boolean;
  isPage?: boolean;
  isServerComponent?: boolean;
  // Additional properties with specific types for known extensions
  imports?: Array<{ name: string; path: string; isDefault: boolean }>;
  exports?: Array<{ name: string; isDefault: boolean }>;
  propTypes?: Record<string, string>;
  // Allow additional string keys with unknown values for future extensions
  [key: string]: unknown;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  filePath: string;
  line: number;
  code: string;
  framework: string;
  fix?: {
    type: string;
    path?: string;
    code?: string;
    replacement?: string;
    position?: { line: number; column: number };
    // Allow additional properties needed for different fix types
    [key: string]: unknown;
  };
  documentation?: string;
  component?: string;
  page?: string;
  hook?: string;
  utility?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface AnalysisOptions {
  strict?: boolean;
  focus?: string;
  config?: Record<string, unknown>;
}

export interface AnalysisResults {
  project: ValidationResult;
  frameworks: {
    typescript: ValidationResult;
    typescript_best_practices: ValidationResult;
    nextjs: ValidationResult;
    react: ValidationResult;
    tailwind: ValidationResult;
    vitest: ValidationResult;
  };
  components: ValidationResult;
  pages: ValidationResult;
  hooks: ValidationResult;
  utilities: ValidationResult;
}

export interface AnalysisSummary {
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  frameworkIssues: Record<string, number>;
  score: number;
}

export interface AnalysisReport {
  projectName: string;
  projectRoot: string;
  timestamp: Date;
  results: AnalysisResults;
  summary: AnalysisSummary;
  options: AnalysisOptions;
}

export interface TestGenerationOptions {
  coverageThreshold?: number;
  includeA11y?: boolean;
  componentName?: string;
  filter?: string;
  dryRun?: boolean;
  overwrite?: boolean;
  config?: Record<string, unknown>;
}

export interface TestGenerationResult {
  testPath: string;
  componentPath: string;
  success: boolean;
  message?: string;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

export interface HealingOperation {
  type: string;
  path?: string;
  oldPath?: string;
  newPath?: string;
  success: boolean;
  description: string;
}

export interface TransformationResult {
  originalPath: string;
  transformedPath: string;
  originalContent: string;
  transformedContent: string;
  operations: HealingOperation[];
  success: boolean;
}

export interface HealingOptions {
  dryRun?: boolean;
  maxFix?: number;
  filter?: string;
  component?: string;
  generateTests?: boolean;
  bestPractices?: boolean;
  healing?: {
    migrateLegacyCode?: boolean;
    generateMissingTests?: boolean;
    updateDependencies?: boolean;
    keepOriginalFiles?: boolean;
    maxFix?: number;
  };
  testing?: {
    coverage?: number;
    includeA11y?: boolean;
    testFilePattern?: string;
  };
  config?: Record<string, unknown>;
}

export interface HealingReport {
  startTime: number;
  endTime: number;
  operations: HealingOperation[];
  success: boolean;
  stats: {
    totalIssues: number;
    fixedIssues: number;
    limitApplied?: boolean;
    remainingIssues?: number;
    fixLimit?: number | null;
  };
}