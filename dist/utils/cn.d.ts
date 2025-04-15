import { type ClassValue } from "clsx";
/**
 * Combines multiple class values into a single className string,
 * resolving Tailwind conflicts with tailwind-merge
 */
export declare function cn(...inputs: ClassValue[]): string;
