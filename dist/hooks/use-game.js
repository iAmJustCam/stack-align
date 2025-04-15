"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGame = void 0;
const react_1 = require("react");
/**
 * Hook to fetch game data by ID
 *
 * @param id - Unique identifier for the game
 * @returns Game data from the API
 */
const useGame = (id) => {
    // Using React 19's "use" hook to handle Promise and Suspense
    return (0, react_1.use)(fetchGameData(id));
};
exports.useGame = useGame;
/**
 * Fetches game data from the API
 *
 * @param id - Unique identifier for the game
 * @returns Promise resolving to game data
 */
async function fetchGameData(id) {
    const response = await fetch(`/api/games/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch game data: ${response.statusText}`);
    }
    return response.json();
}
