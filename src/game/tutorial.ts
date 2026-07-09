// Tutorial step order, on-screen copy, and forced door layout.
import type { DoorChoice, EnemyState, TutorialStep } from "./types";

export const tutorialCopy: Record<TutorialStep, { title: string; message: string }> = {
  swipe: {
    title: "Step 1 of 8",
    message: "Swipe along the glowing trail so the tiles equal the target, then release to strike.",
  },
  finish: {
    title: "Step 2 of 8",
    message: "Good hit. The monster's health bar shows how close it is to falling.",
  },
  enemyHit: {
    title: "Step 3 of 8",
    message: "Enemies attack the player. Watch your Player HP bar when this one lunges.",
  },
  killEnemy: {
    title: "Step 4 of 8",
    message: "Now finish the monster. Keep solving paths until its health bar reaches zero.",
  },
  gold: {
    title: "Step 5 of 8",
    message: "Gold drops after a kill. Watch the coins fly into the gold counter.",
  },
  door: {
    title: "Step 6 of 8",
    message: "Every kill earns gold and opens doors. Step into the Torch Shop to spend it.",
  },
  shop: {
    title: "Step 7 of 8",
    message: "Buy Heal HP now. It costs 15g and restores the Player HP bar below.",
  },
  healthBought: {
    title: "Step 8 of 8",
    message: "Health increased and gold was spent. Check HP and gold, then Venture Onward.",
  },
};

// The first door choice is fixed during the tutorial so the shop is always offered.
export function makeTutorialDoors(): DoorChoice[] {
  return [
    { id: "useful-shop", kind: "shop", label: "Torch Shop", icon: "shop", tone: "safe" },
    { id: "fight-monster", kind: "monster", label: "Monster", icon: "claw", tone: "danger" },
  ];
}

export function makeTutorialEnemy(enemy: EnemyState): EnemyState {
  return { ...enemy, hp: 4, maxHp: 4 };
}
