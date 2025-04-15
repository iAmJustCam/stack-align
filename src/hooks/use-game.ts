// src/hooks/use-game.ts
import type { GameData } from "@/types/game";
import { use } from "react";

/**
 * Hook to fetch game data by ID
 *
 * @param id - Unique identifier for the game
 * @returns Game data from the API
 */
export const useGame = (id: string): GameData => {
  // Using React 19's "use" hook to handle Promise and Suspense
  return use(fetchGameData(id));
};

/**
 * Fetches game data from the API
 *
 * @param id - Unique identifier for the game
 * @returns Promise resolving to game data
 */
async function fetchGameData(id: string): Promise<GameData> {
  const response = await fetch(`/api/games/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch game data: ${response.statusText}`);
  }

  return response.json();
}
