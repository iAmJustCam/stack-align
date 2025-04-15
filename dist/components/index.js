"use strict";
// src/components/index.ts
/**
 * Barrel export file for components
 * Enables importing from '@/components' instead of direct paths
 */
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
// UI Components
__exportStar(require("./game-card"), exports);
// Export these when the files are created
// export * from "./game-filter";
// export * from "./game-list";
// export * from "./game-search";
// Layout Components - uncomment when implemented
// export * from "./layout/footer";
// export * from "./layout/header";
// export * from "./layout/sidebar";
// Game UI Components - uncomment when implemented
// export * from "./ui/badge";
// export * from "./ui/button";
// export * from "./ui/card";
