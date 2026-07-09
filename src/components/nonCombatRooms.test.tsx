// Verifies non-combat rooms show player health and the current item choices.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BargainView } from "./BargainView";
import { ShopView } from "./ShopView";
import type { GameState } from "../game/types";

const state: GameState = {
  phase: "shop",
  floor: 1,
  roomsCleared: 1,
  player: {
    hp: 120,
    maxHp: 120,
    temporaryHp: 0,
    gold: 60,
    goldBonus: 0,
    damageReductionArmor: 0,
    barbedArmor: 0,
    swordDamage: 1,
    oracleLensChance: 0,
    negativesUnlocked: false,
    extraDamageTaken: 0,
    lifesteal: 0,
    permutationBonus: 0,
    items: {},
  },
  enemy: null,
  puzzle: null,
  doors: [],
  feedback: null,
  frozenUntil: 0,
  paused: false,
  tutorial: null,
  tutorialEnemyHitDone: false,
  showFloorScroll: true,
  pendingBossFight: false,
  fightStats: { misses: 0, hitsTaken: 0, correctHits: 0 },
  struggleTutorialOffered: false,
  tutorialOffer: false,
};

describe("non-combat rooms", () => {
  it("shows health and armor items in the shop", () => {
    const html = renderToStaticMarkup(
      <ShopView
        state={state}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onBuyUpgrade={() => undefined}
        onContinue={() => undefined}
      />,
    );

    expect(html).toContain("120/120");
    expect(html).toContain("Damage Reduction Armor");
    expect(html).toContain("Armor");
    expect(html).toContain("Barbed Armor");
    expect(html).not.toContain("Freeze");
  });

  it("shows health and Giant Equation in the bargain room", () => {
    const html = renderToStaticMarkup(
      <BargainView
        state={{ ...state, phase: "bargain" }}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onTakeBargain={() => undefined}
      />,
    );

    expect(html).toContain("120/120");
    expect(html).toContain("Giant Equation");
    expect(html).toContain("Gain 2 sword damage and 40 max HP.");
    expect(html).toContain("Future answers need 1 extra number");
  });
});
