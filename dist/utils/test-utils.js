"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockReactUse = mockReactUse;
exports.mockUseGame = mockUseGame;
exports.mockFetch = mockFetch;
exports.resetAllMocks = resetAllMocks;
const vitest_1 = require("vitest");
/**
 * Mocks React's use hook to return provided data
 *
 * @param data - Data to be returned by the mocked use hook
 */
function mockReactUse(data) {
    vitest_1.vi.mock("react", async () => {
        const actual = await vitest_1.vi.importActual("react");
        return {
            ...actual,
            use: vitest_1.vi.fn(() => data),
        };
    });
}
/**
 * Mocks the useGame hook to return provided game data
 *
 * @param gameData - Game data to be returned by the mocked hook
 */
function mockUseGame(gameData) {
    vitest_1.vi.mock("@/hooks/use-game", () => ({
        useGame: vitest_1.vi.fn(() => gameData),
    }));
}
/**
 * Creates a mock for fetch API
 */
function mockFetch(data) {
    global.fetch = vitest_1.vi.fn().mockResolvedValue({
        ok: true,
        json: async () => data,
    });
}
/**
 * Resets all mocks
 */
function resetAllMocks() {
    vitest_1.vi.resetAllMocks();
}
