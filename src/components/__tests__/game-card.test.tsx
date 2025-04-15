// src/components/__tests__/game-card.test.tsx
import { mockUseGame } from "@/utils/test-utils";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameCard } from "../game-card";

// Mock the useGame hook with test data
beforeEach(() => {
  mockUseGame({
    title: "Test Game",
    description: "A test game description",
    thumbnail: "/test-thumbnail.jpg",
    category: "Educational",
    level: "Beginner",
  });
});

// Mock props for testing
const mockProps = {
  id: "game-123",
  title: "Test Game",
  description: "A test game description",
  category: "Educational",
  level: "Beginner",
  onPlay: vi.fn(),
};

describe("GameCard", () => {
  it("renders GameCard correctly", () => {
    render(<GameCard {...mockProps} />);

    // Assert component rendered
    expect(screen.getByRole("heading")).toBeInTheDocument();
    expect(screen.getByText(/A test game description/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("handles onPlay correctly", async () => {
    const user = userEvent.setup();

    render(<GameCard {...mockProps} />);

    // Find the element
    const button = screen.getByRole("button");
    await user.click(button);

    // Assert handler was called
    expect(mockProps.onPlay).toHaveBeenCalledWith("game-123");
  });

  it("passes basic accessibility checks", async () => {
    const { container } = render(<GameCard {...mockProps} />);

    // Basic accessibility assertions
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");

    // Image has alt text
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("alt");
  });
});
