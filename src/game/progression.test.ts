// Verifies floor difficulty helpers that sit above raw math grid generation.
import { describe, expect, it, vi } from "vitest";
import { addPermutationBonus, getRoomPathLength } from "./progression";

describe("progression puzzle length rules", () => {
  it("varies normal room path length instead of always using two numbers", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.2).mockReturnValueOnce(0.8);

    expect(getRoomPathLength(3, 1, false)).toBe(3);
    expect(getRoomPathLength(3, 1, false)).toBe(5);

    vi.restoreAllMocks();
  });

  it("adds one answer number for permutation bargains when the grid can fit it", () => {
    expect(addPermutationBonus(3, 3, 1)).toBe(5);
    expect(addPermutationBonus(5, 3, 1)).toBe(5);
    expect(addPermutationBonus(5, 4, 1)).toBe(7);
  });
});
