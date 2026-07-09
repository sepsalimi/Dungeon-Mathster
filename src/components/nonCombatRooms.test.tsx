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
  monsterRoomsCleared: 1,
  player: {
    hp: 100,
    maxHp: 100,
    temporaryHp: 0,
    gold: 60,
    goldBonus: 0,
    damageReductionArmor: 0,
    barbedArmor: 0,
    swordDamage: 1,
    oracleLensChance: 0,
    oraclePathNumbers: 0,
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
  floorIntroNonce: 0,
  pendingBossFight: false,
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

    expect(html).toContain("100/100");
    expect(html).toContain("Damage Reduction Armor");
    expect(html).toContain("Shield");
    expect(html).toContain("Gain 25 shield HP.");
    expect(html).toContain("Barbed Armor");
    expect(html).not.toContain("Freeze");
  });

  it("shows temporary shield HP as a silver shield bar", () => {
    const html = renderToStaticMarkup(
      <ShopView
        state={{ ...state, player: { ...state.player, temporaryHp: 25 } }}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onBuyUpgrade={() => undefined}
        onContinue={() => undefined}
      />,
    );

    expect(html).toContain("Player HP 100 of 100, Shield 25");
    expect(html).toContain("player-vitals__shield");
    expect(html).toContain("item-icon--shield");
  });

  it("guides the tutorial player to buy health before continuing", () => {
    const html = renderToStaticMarkup(
      <ShopView
        state={{ ...state, tutorial: "shop", player: { ...state.player, hp: 98, gold: 18 } }}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onBuyUpgrade={() => undefined}
        onContinue={() => undefined}
      />,
    );

    expect(html).toContain("98/100");
    expect(html).toContain("gold-chip--tutorial");
    expect(html).toContain("upgrade-row--tutorial");
    expect(html).toContain("Heal HP");
    expect(html).toContain("15g");
    expect(html).toContain("disabled=\"\"");
  });

  it("shows the tutorial health and gold change after buying health", () => {
    const html = renderToStaticMarkup(
      <ShopView
        state={{
          ...state,
          tutorial: "healthBought",
          player: { ...state.player, hp: 100, gold: 3 },
          feedback: { kind: "buy", message: "Heal HP purchased: -15g. HP 98/100 -> 100/100.", nonce: 1 },
        }}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onBuyUpgrade={() => undefined}
        onContinue={() => undefined}
      />,
    );

    expect(html).toContain("100/100");
    expect(html).toContain("Heal HP purchased: -15g. HP 98/100 -&gt; 100/100.");
    expect(html).toContain("gold-chip--tutorial");
    expect(html).toContain(">3</strong>");
    expect(html).toContain("primary-action--tutorial");
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

    expect(html).toContain("100/100");
    expect(html).toContain("25% chance the first number in an answer glows.");
    expect(html).toContain("Negative numbers enter the grid.");
    expect(html).toContain("Giant Equation");
    expect(html).toContain("Gain 2 sword damage and 40 max HP.");
    expect(html).toContain("Future answers need 1 extra number");
  });

  it("shows Oracle Lens max HP downside when negatives are already unlocked", () => {
    const html = renderToStaticMarkup(
      <BargainView
        state={{
          ...state,
          phase: "bargain",
          player: { ...state.player, negativesUnlocked: true, oracleLensChance: 0.25 },
        }}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onTakeBargain={() => undefined}
      />,
    );

    expect(html).toContain("Lose 20 max HP.");
    expect(html).not.toContain("25% chance the first number in an answer glows.</span><span class=\"bargain-downside\">Negative numbers enter the grid.");
  });
});
