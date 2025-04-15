"use strict";
// src/components/game-card.tsx
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameCard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const use_game_1 = require("@/hooks/use-game");
const cn_1 = require("@/utils/cn");
/**
 * A card component that displays game information and a play button
 */
const GameCard = ({ id, title, description, category, level, onPlay, }) => {
    // Using custom hook for data fetching - proper separation of concerns
    const gameData = (0, use_game_1.useGame)(id);
    const handlePlayClick = () => {
        onPlay(id);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, cn_1.cn)("p-4 border rounded-lg shadow bg-white", "hover:shadow-md transition-all duration-300"), "data-testid": "game-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("img", { src: (gameData === null || gameData === void 0 ? void 0 : gameData.thumbnail) || "/placeholder.jpg", alt: (gameData === null || gameData === void 0 ? void 0 : gameData.title) || title, className: "w-24 h-24 rounded mr-4" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-bold", children: (gameData === null || gameData === void 0 ? void 0 : gameData.title) || title }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: (gameData === null || gameData === void 0 ? void 0 : gameData.description) || description }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2", children: [(0, jsx_runtime_1.jsx)("span", { className: (0, cn_1.cn)("inline-block px-2 py-1 rounded text-xs mr-2", "bg-blue-100 text-blue-800"), children: (gameData === null || gameData === void 0 ? void 0 : gameData.category) || category }), (0, jsx_runtime_1.jsx)("span", { className: (0, cn_1.cn)("inline-block px-2 py-1 rounded text-xs", "bg-green-100 text-green-800"), children: (gameData === null || gameData === void 0 ? void 0 : gameData.level) || level })] })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: handlePlayClick, className: (0, cn_1.cn)("mt-4 w-full py-2 px-4 rounded font-medium", "bg-purple-600 hover:bg-purple-700 text-white"), "aria-label": `Play ${(gameData === null || gameData === void 0 ? void 0 : gameData.title) || title}`, children: "Play Now" })] }));
};
exports.GameCard = GameCard;
