import { describe, expect, it } from "vitest";
import { evaluatePath, isCorrectPath, isValidPathShape, makePuzzle } from "./math";

describe("math puzzle generation", () => {
  it("always creates a valid answer for 3x3 rooms", () => {
    for (let index = 0; index < 50; index += 1) {
      const puzzle = makePuzzle(3);

      expect(puzzle.tiles).toHaveLength(9);
      expect(isValidPathShape(puzzle.answerPath, puzzle.tiles)).toBe(true);
      expect(isCorrectPath(puzzle.answerPath, puzzle.tiles, puzzle.target)).toBe(true);
    }
  });

  it("always creates a valid answer for 4x4 boss rooms", () => {
    for (let index = 0; index < 50; index += 1) {
      const puzzle = makePuzzle(4);

      expect(puzzle.tiles).toHaveLength(16);
      expect(isValidPathShape(puzzle.answerPath, puzzle.tiles)).toBe(true);
      expect(isCorrectPath(puzzle.answerPath, puzzle.tiles, puzzle.target)).toBe(true);
    }
  });

  it("rejects diagonal moves and reused tiles", () => {
    const puzzle = makePuzzle(3);
    const diagonalPath = ["0-0", "1-1", "2-2"];
    const reusedPath = ["0-0", "0-1", "0-0"];

    expect(isValidPathShape(diagonalPath, puzzle.tiles)).toBe(false);
    expect(isValidPathShape(reusedPath, puzzle.tiles)).toBe(false);
  });

  it("evaluates addition-only paths", () => {
    const puzzle = {
      size: 3,
      target: 13,
      answerPath: ["0-0", "0-1", "0-2", "1-2", "2-2"],
      tiles: [
        { id: "0-0", row: 0, col: 0, type: "number" as const, value: "5" },
        { id: "0-1", row: 0, col: 1, type: "operator" as const, value: "+" },
        { id: "0-2", row: 0, col: 2, type: "number" as const, value: "2" },
        { id: "1-0", row: 1, col: 0, type: "operator" as const, value: "+" },
        { id: "1-1", row: 1, col: 1, type: "number" as const, value: "4" },
        { id: "1-2", row: 1, col: 2, type: "operator" as const, value: "+" },
        { id: "2-0", row: 2, col: 0, type: "number" as const, value: "1" },
        { id: "2-1", row: 2, col: 1, type: "operator" as const, value: "+" },
        { id: "2-2", row: 2, col: 2, type: "number" as const, value: "6" },
      ],
    };

    expect(evaluatePath(puzzle.answerPath, puzzle.tiles)).toBe(13);
  });
  it("can generate valid puzzles with negative number tiles", () => {
    let sawNegative = false;

    for (let index = 0; index < 75; index += 1) {
      const puzzle = makePuzzle(3, { allowNegative: true });
      sawNegative ||= puzzle.tiles.some((tile) => tile.type === "number" && Number(tile.value) < 0);

      expect(isValidPathShape(puzzle.answerPath, puzzle.tiles)).toBe(true);
      expect(isCorrectPath(puzzle.answerPath, puzzle.tiles, puzzle.target)).toBe(true);
    }

    expect(sawNegative).toBe(true);
  });
});
