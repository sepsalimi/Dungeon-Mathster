// Verifies combat tutorial cues render the guidance and highlights needed for onboarding.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CombatView } from "./CombatView";
import type { GameState } from "../game/types";

const combatState: GameState = {
  phase: "combat",
  floor: 1,
  roomsCleared: 0,
  monsterRoomsCleared: 0,
  player: {
    hp: 98,
    maxHp: 100,
    temporaryHp: 0,
    gold: 0,
    goldBonus: 0,
    damageReductionArmor: 0,
    barbedArmor: 0,
    swordDamage: 2,
    oracleLensChance: 0,
    oraclePathNumbers: 0,
    negativesUnlocked: false,
    extraDamageTaken: 0,
    lifesteal: 0,
    permutationBonus: 0,
    items: {},
  },
  enemy: {
    name: "Minus Mite",
    hp: 8,
    maxHp: 10,
    damage: 2,
    isBoss: false,
  },
  puzzle: {
    size: 3,
    target: 3,
    answerPath: ["0-0", "0-1", "0-2"],
    tiles: [
      { id: "0-0", row: 0, col: 0, type: "number", value: "1" },
      { id: "0-1", row: 0, col: 1, type: "operator", value: "+" },
      { id: "0-2", row: 0, col: 2, type: "number", value: "2" },
      { id: "1-0", row: 1, col: 0, type: "operator", value: "+" },
      { id: "1-1", row: 1, col: 1, type: "number", value: "4" },
      { id: "1-2", row: 1, col: 2, type: "operator", value: "+" },
      { id: "2-0", row: 2, col: 0, type: "number", value: "5" },
      { id: "2-1", row: 2, col: 1, type: "operator", value: "+" },
      { id: "2-2", row: 2, col: 2, type: "number", value: "6" },
    ],
  },
  doors: [],
  feedback: null,
  frozenUntil: 0,
  paused: false,
  tutorial: "killEnemy",
  tutorialEnemyHitDone: true,
  showFloorScroll: false,
  floorIntroNonce: 0,
  pendingBossFight: false,
};

describe("CombatView tutorial cues", () => {
  it("keeps the swipe guide and health highlights visible while finishing the tutorial enemy", () => {
    const html = renderToStaticMarkup(
      <CombatView
        state={combatState}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onSubmitPath={() => undefined}
      />,
    );

    expect(html).toContain("swipe-guide");
    expect(html).toContain("target-card--tutorial");
    expect(html).toContain("enemy-plate--tutorial");
    expect(html).toContain("player-health-card--tutorial");
  });

  it("raises the HUD and highlights gold during the gold tutorial step", () => {
    const html = renderToStaticMarkup(
      <CombatView
        state={{ ...combatState, enemy: null, puzzle: null, tutorial: "gold", player: { ...combatState.player, gold: 18 } }}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onSubmitPath={() => undefined}
      />,
    );

    expect(html).toContain("hud--gold-tutorial");
    expect(html).toContain("gold-chip--tutorial");
  });

  it("shows the upgraded Oracle Lens two-number path when its 25% chance triggers", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const html = renderToStaticMarkup(
      <CombatView
        state={{
          ...combatState,
          tutorial: null,
          player: { ...combatState.player, oracleLensChance: 0.25, oraclePathNumbers: 2, items: { oracleLens: 2 } },
        }}
        soundLevel="mute"
        onPause={() => undefined}
        onCycleSoundLevel={() => undefined}
        onSubmitPath={() => undefined}
      />,
    );

    expect(html.match(/is-start-hint/g)).toHaveLength(3);
    expect(html).toContain("<b>Start</b>");
    vi.restoreAllMocks();
  });
});
