"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestForComponent = exports.generateTests = exports.healProject = exports.healComponent = exports.validateVitestImplementation = exports.validateTypeScript5Implementation = exports.validateTailwindV4Implementation = exports.validateReact19Implementation = exports.validateNextJs15Implementation = exports.validateArchitecture = exports.analyzeProjectTopDown = void 0;
// Main exports for the Tech Stack Alignment System
const top_down_analyzer_1 = require("./core/top-down-analyzer");
Object.defineProperty(exports, "analyzeProjectTopDown", { enumerable: true, get: function () { return top_down_analyzer_1.analyzeProjectTopDown; } });
const component_healer_1 = require("./healers/component-healer");
Object.defineProperty(exports, "healComponent", { enumerable: true, get: function () { return component_healer_1.healComponent; } });
const healing_engine_1 = require("./healers/healing-engine");
Object.defineProperty(exports, "healProject", { enumerable: true, get: function () { return healing_engine_1.healProject; } });
const test_generation_engine_1 = require("./healers/test-generation-engine");
Object.defineProperty(exports, "generateTests", { enumerable: true, get: function () { return test_generation_engine_1.generateTests; } });
Object.defineProperty(exports, "generateTestForComponent", { enumerable: true, get: function () { return test_generation_engine_1.generateTestForComponent; } });
const architecture_validator_1 = require("./validators/architecture-validator");
Object.defineProperty(exports, "validateArchitecture", { enumerable: true, get: function () { return architecture_validator_1.validateArchitecture; } });
const nextjs15_validator_1 = require("./validators/nextjs15-validator");
Object.defineProperty(exports, "validateNextJs15Implementation", { enumerable: true, get: function () { return nextjs15_validator_1.validateNextJs15Implementation; } });
const react19_validator_1 = require("./validators/react19-validator");
Object.defineProperty(exports, "validateReact19Implementation", { enumerable: true, get: function () { return react19_validator_1.validateReact19Implementation; } });
const tailwindv4_validator_1 = require("./validators/tailwindv4-validator");
Object.defineProperty(exports, "validateTailwindV4Implementation", { enumerable: true, get: function () { return tailwindv4_validator_1.validateTailwindV4Implementation; } });
const typescript5_validator_1 = require("./validators/typescript5-validator");
Object.defineProperty(exports, "validateTypeScript5Implementation", { enumerable: true, get: function () { return typescript5_validator_1.validateTypeScript5Implementation; } });
const vitest_validator_1 = require("./validators/vitest-validator");
Object.defineProperty(exports, "validateVitestImplementation", { enumerable: true, get: function () { return vitest_validator_1.validateVitestImplementation; } });
// Export types
__exportStar(require("./types"), exports);
