// src/components/game-card.tsx
"use client";

import { useGame } from "@/hooks/use-game";
import type { GameCardProps } from "@/types/game";
import { cn } from "@/utils/cn";
import React from "react";

/**
 * A card component that displays game information and a play button
 */
export const GameCard: React.FC<GameCardProps> = ({
  id,
  title,
  description,
  category,
  level,
  onPlay,
}) => {
  // Using custom hook for data fetching - proper separation of concerns
  const gameData = useGame(id);

  const handlePlayClick = () => {
    onPlay(id);
  };

  return (
    <div
      className={cn(
        "p-4 border rounded-lg shadow bg-white",
        "hover:shadow-md transition-all duration-300"
      )}
      data-testid="game-card"
    >
      <div className="flex items-center">
        <img
          src={gameData?.thumbnail || "/placeholder.jpg"}
          alt={gameData?.title || title}
          className="w-24 h-24 rounded mr-4"
        />
        <div>
          <h3 className="text-lg font-bold">{gameData?.title || title}</h3>
          <p className="text-gray-600">
            {gameData?.description || description}
          </p>
          <div className="mt-2">
            <span
              className={cn(
                "inline-block px-2 py-1 rounded text-xs mr-2",
                "bg-blue-100 text-blue-800"
              )}
            >
              {gameData?.category || category}
            </span>
            <span
              className={cn(
                "inline-block px-2 py-1 rounded text-xs",
                "bg-green-100 text-green-800"
              )}
            >
              {gameData?.level || level}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={handlePlayClick}
        className={cn(
          "mt-4 w-full py-2 px-4 rounded font-medium",
          "bg-purple-600 hover:bg-purple-700 text-white"
        )}
        aria-label={`Play ${gameData?.title || title}`}
      >
        Play Now
      </button>
    </div>
  );
};
