// Tutorial step order, on-screen copy, and forced door layout.
import type { DoorChoice, TutorialStep } from "./types";

export const tutorialCopy: Record<TutorialStep, { title: string; message: string }> = {
  swipe: {
    title: "Step 1 of 5",
    message: "Swipe along the glowing trail so the tiles equal the target, then release to strike.",
  },
  finish: {
    title: "Step 2 of 5",
    message: "Good hit. Keep solving paths until the monster falls.",
  },
  enemyHit: {
    title: "Step 3 of 5",
    message: "Sometimes the enemy will hit you. Watch your health bar when it strikes.",
  },
  door: {
    title: "Step 4 of 5",
    message: "Every kill earns gold and opens doors. Step into the Torch Shop to spend it.",
  },
  shop: {
    title: "Step 5 of 5",
    message: "Buy an upgrade, then Venture Onward. Deeper down, Bargain and Mystery doors await. What they hold is yours to discover.",
  },
};

// The first door choice is fixed during the tutorial so the shop is always offered.
export function makeTutorialDoors(): DoorChoice[] {
  return [
    { id: "useful-shop", kind: "shop", label: "Torch Shop", icon: "shop", tone: "safe" },
    { id: "fight-monster", kind: "monster", label: "Monster", icon: "claw", tone: "danger" },
  ];
}
