// Verifies tutorial-only helpers keep onboarding predictable without changing normal rooms.
import { describe, expect, it } from "vitest";
import { makeTutorialEnemy } from "./tutorial";
import type { EnemyState } from "./types";

const enemy: EnemyState = {
  name: "Cinder Imp",
  hp: 10,
  maxHp: 10,
  damage: 2,
  isBoss: false,
};

describe("tutorial helpers", () => {
  it("shortens the tutorial enemy so one final guided strike can finish it", () => {
    expect(makeTutorialEnemy(enemy)).toEqual({
      ...enemy,
      hp: 4,
      maxHp: 4,
    });
  });
});
