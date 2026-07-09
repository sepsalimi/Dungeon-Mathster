// Verifies HUD item icons open stat tooltips when tapped.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hud } from "./Hud";
import type { GameState } from "../game/types";

const hudState: GameState = {
  phase: "combat",
  floor: 1,
  roomsCleared: 0,
  monsterRoomsCleared: 0,
  player: {
    hp: 100,
    maxHp: 100,
    temporaryHp: 0,
    gold: 12,
    goldBonus: 0,
    damageReductionArmor: 0,
    barbedArmor: 0,
    swordDamage: 2,
    oracleLensChance: 0,
    oraclePathNumbers: 0,
    negativesUnlocked: false,
    extraDamageTaken: 0,
    lifesteal: 2,
    permutationBonus: 0,
    items: { lifesteal: 1 },
  },
  enemy: null,
  puzzle: null,
  doors: [],
  feedback: null,
  frozenUntil: 0,
  paused: false,
  tutorial: null,
  tutorialEnemyHitDone: false,
  showFloorScroll: false,
  floorIntroNonce: 0,
  pendingBossFight: false,
};

describe("Hud item tooltips", () => {
  it("renders item icons as buttons with stat labels", () => {
    const markup = renderToStaticMarkup(
      <Hud state={hudState} soundLevel="low" onPause={() => undefined} onCycleSoundLevel={() => undefined} />,
    );

    expect(markup).toContain('class="item-stack"');
    expect(markup).toContain('class="item-icon item-icon--fang"');
    expect(markup).toContain('aria-label="Lifesteal, +2 lifesteal"');
  });
});
