/**
 * Tech Stack Alignment System Configuration
 * 
 * This configuration file controls how stack-align validates and heals your project.
 */
module.exports = {
  // Project settings
  project: {
    name: "My Next.js Application",
    rootDir: ".",
    // Directories to include in analysis
    include: ["src/**/*"],
    // Directories or files to exclude from analysis
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  },
  
  // Framework validation settings
  frameworks: {
    // React 19 validation settings
    react: {
      enabled: true,
      version: "19",
      // Specific React rules to enforce or ignore
      rules: {
        "react-hooks-deps": "error",
        "use-client-directive": "error",
        "prefer-named-exports": "warning",
        "component-naming": "error",
        "event-handler-naming": "warning",
        "destructured-props": "warning"
      }
    },
    
    // Next.js 15 validation settings
    nextjs: {
      enabled: true,
      version: "15",
      // Specific Next.js rules to enforce or ignore
      rules: {
        "app-router-pattern": "error",
        "metadata-api": "warning",
        "server-actions": "warning"
      }
    },
    
    // TypeScript 5 validation settings
    typescript: {
      enabled: true,
      version: "5",
      // Specific TypeScript rules to enforce or ignore
      rules: {
        "explicit-types": "error",
        "namespace-imports": "error",
        "proper-type-imports": "warning",
        "no-any": "warning"
      }
    },
    
    // Tailwind v4 validation settings
    tailwind: {
      enabled: true,
      version: "4",
      // Specific Tailwind rules to enforce or ignore
      rules: {
        "prefer-tailwind-classes": "warning",
        "organize-classes": "suggestion",
        "use-cn-helper": "warning"
      }
    },
    
    // Testing validation settings
    testing: {
      enabled: true,
      framework: "vitest",
      // Specific testing rules to enforce or ignore
      rules: {
        "test-coverage": "warning",
        "component-tests": "error",
        "hook-tests": "warning"
      }
    }
  },
  
  // Healing settings
  healing: {
    // Whether to automatically fix issues
    autoFix: true,
    // Whether to make a backup of files before healing
    backup: true,
    // Whether to run in dry-run mode (no actual changes)
    dryRun: false,
    // Whether to generate tests automatically
    generateTests: true,
    // Whether to apply TypeScript best practices
    applyTypeScriptBestPractices: true,
    // Whether to apply React best practices
    applyReactBestPractices: true,
    // Whether to apply Tailwind best practices
    applyTailwindBestPractices: true
  },
  
  // Reporting settings
  reporting: {
    // Output format for reports
    format: "json",
    // Where to save reports
    outputDir: "reports",
    // Whether to include suggestions in reports
    includeSuggestions: true
  }
};