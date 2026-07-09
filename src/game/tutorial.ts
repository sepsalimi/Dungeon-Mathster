// First-run tutorial: step order, on-screen copy, forced door layout, and
// the localStorage flag that keeps it from showing again once finished or skipped.
import type { DoorChoice, TutorialStep } from "./types";

const TUTORIAL_SEEN_KEY = "dungeon-mathster-tutorial-seen";

export const tutorialCopy: Record<TutorialStep, { title: string; message: string }> = {
  swipe: {
    title: "Step 1 of 4",
    message: "Swipe along the glowing trail so the tiles equal the target, then release to strike.",
  },
  finish: {
    title: "Step 2 of 4",
    message: "Good hit. Keep solving paths until the monster falls, and mind its counterattacks.",
  },
  door: {
    title: "Step 3 of 4",
    message: "Every kill earns gold and opens doors. Step into the Torch Shop to spend it.",
  },
  shop: {
    title: "Step 4 of 4",
    message: "Buy an upgrade, then Venture Onward. Deeper down, Bargain and Mystery doors await. What they hold is yours to discover.",
  },
};

export function shouldShowTutorial(): boolean {
  return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === null;
}

export function markTutorialSeen(): void {
  window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
}

// The first door choice is fixed during the tutorial so the shop is always offered.
export function makeTutorialDoors(): DoorChoice[] {
  return [
    { id: "useful-shop", kind: "shop", label: "Torch Shop", icon: "shop", tone: "safe" },
    { id: "fight-monster", kind: "monster", label: "Monster", icon: "claw", tone: "danger" },
  ];
}
