import { vi } from "vitest";

/**
 * Mocks React's use hook to return provided data
 *
 * @param data - Data to be returned by the mocked use hook
 */
export function mockReactUse<T>(data: T): void {
  vi.mock("react", async () => {
    const actual = await vi.importActual("react") as Record<string, unknown>;
    return {
      ...actual,
      use: vi.fn(() => data),
    };
  });
}

/**
 * Mocks the useGame hook to return provided game data
 *
 * @param gameData - Game data to be returned by the mocked hook
 */
export function mockUseGame<T>(gameData: T): void {
  vi.mock("@/hooks/use-game", () => ({
    useGame: vi.fn(() => gameData),
  }));
}

/**
 * Creates a mock for fetch API
 */
export function mockFetch<T>(data: T): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

/**
 * Resets all mocks
 */
export function resetAllMocks(): void {
  vi.resetAllMocks();
}
