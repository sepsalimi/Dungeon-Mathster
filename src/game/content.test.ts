// Verifies floor room routing rules that control how many fights happen before the boss.
import { describe, expect, it, vi } from "vitest";
import { makeDoorChoices, MIN_MONSTER_ROOMS_BEFORE_BOSS, ROOMS_BEFORE_BOSS } from "./content";

describe("door choice routing", () => {
  it("opens the boss gate after five total pre-boss rooms", () => {
    const doors = makeDoorChoices(ROOMS_BEFORE_BOSS, MIN_MONSTER_ROOMS_BEFORE_BOSS);

    expect(doors).toEqual([{ id: "boss-gate", kind: "boss", label: "Boss Gate", icon: "crown", tone: "danger" }]);
  });

  it("forces a monster when a useful room would skip the three monster minimum", () => {
    const doors = makeDoorChoices(ROOMS_BEFORE_BOSS - 1, MIN_MONSTER_ROOMS_BEFORE_BOSS - 1);

    expect(doors).toEqual([{ id: "fight-monster", kind: "monster", label: "Monster", icon: "claw", tone: "danger" }]);
  });

  it("offers useful rooms while the player can still fight at least three monsters", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const doors = makeDoorChoices(ROOMS_BEFORE_BOSS - 1, MIN_MONSTER_ROOMS_BEFORE_BOSS);

    expect(doors.map((door) => door.kind).sort()).toEqual(["monster", "shop"]);
    vi.restoreAllMocks();
  });
});
