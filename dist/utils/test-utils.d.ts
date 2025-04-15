/**
 * Mocks React's use hook to return provided data
 *
 * @param data - Data to be returned by the mocked use hook
 */
export declare function mockReactUse<T>(data: T): void;
/**
 * Mocks the useGame hook to return provided game data
 *
 * @param gameData - Game data to be returned by the mocked hook
 */
export declare function mockUseGame<T>(gameData: T): void;
/**
 * Creates a mock for fetch API
 */
export declare function mockFetch<T>(data: T): void;
/**
 * Resets all mocks
 */
export declare function resetAllMocks(): void;
