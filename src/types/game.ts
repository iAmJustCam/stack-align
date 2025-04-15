// src/types/game.ts
/**
 * Type definitions for game-related components and data
 */

/**
 * Props for the GameCard component
 */
export interface GameCardProps {
  /** Unique identifier for the game */
  id: string;
  /** Title of the game */
  title: string;
  /** Description of the game */
  description: string;
  /** Category/genre of the game */
  category: string;
  /** Difficulty level of the game */
  level: string;
  /** Handler called when the play button is clicked */
  onPlay: (id: string) => void;
}

/**
 * Game data returned from the API
 */
export interface GameData {
  /** Title of the game */
  title: string;
  /** Description of the game */
  description: string;
  /** URL to the game thumbnail image */
  thumbnail: string;
  /** Category/genre of the game */
  category: string;
  /** Difficulty level of the game */
  level: string;
  /** Additional metadata about the game */
  metadata?: {
    /** Average rating from users (1-5) */
    rating?: number;
    /** Number of times the game has been played */
    plays?: number;
    /** Estimated completion time in minutes */
    completionTime?: number;
  };
}
