import type { GameData } from "@/types/game";
/**
 * Hook to fetch game data by ID
 *
 * @param id - Unique identifier for the game
 * @returns Game data from the API
 */
export declare const useGame: (id: string) => GameData;
