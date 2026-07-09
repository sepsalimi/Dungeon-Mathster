// First-run tutorial: step order, on-screen copy, forced door layout, and
// the localStorage flag that keeps it from showing again once finished or skipped.
import { getTutorialOnNewGame, markTutorialSeenIfNeeded } from "./settings";
import type { DoorChoice, TutorialStep } from "./types";

export const tutorialCopy: Record<TutorialStep, { title: string; message: string }> = {
  swipe: {
    title: "Step 1 of 7",
    message: "Swipe along the glowing trail so the tiles equal the target, then release to strike.",
  },
  finish: {
    title: "Step 2 of 7",
    message: "Good hit. The enemy health bar shows how close the monster is to falling.",
  },
  enemyHit: {
    title: "Step 3 of 7",
    message: "Enemies strike back. Watch your health bar when this one attacks.",
  },
  killEnemy: {
    title: "Step 4 of 7",
    message: "Now finish the monster. Keep solving paths until its health bar reaches zero.",
  },
  gold: {
    title: "Step 5 of 7",
    message: "Gold drops after a kill. Watch it fly into the gold icon at the top.",
  },
  door: {
    title: "Step 6 of 7",
    message: "Every kill earns gold and opens doors. Step into the Torch Shop to spend it.",
  },
  shop: {
    title: "Step 7 of 7",
    message: "Buy an upgrade, then Venture Onward. Deeper down, Bargain and Mystery doors await. What they hold is yours to discover.",
  },
};

export function shouldShowTutorial(): boolean {
  return getTutorialOnNewGame();
}

export function markTutorialSeen(): void {
  markTutorialSeenIfNeeded();
}

// The first door choice is fixed during the tutorial so the shop is always offered.
export function makeTutorialDoors(): DoorChoice[] {
  return [
    { id: "useful-shop", kind: "shop", label: "Torch Shop", icon: "shop", tone: "safe" },
    { id: "fight-monster", kind: "monster", label: "Monster", icon: "claw", tone: "danger" },
  ];
}
