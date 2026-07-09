// Persisted player preferences (tutorial on new runs, etc.).
const TUTORIAL_ON_NEW_GAME_KEY = "dungeon-mathster-tutorial-on-new-game";
const TUTORIAL_SEEN_KEY = "dungeon-mathster-tutorial-seen";

export function getTutorialOnNewGame(): boolean {
  const stored = window.localStorage.getItem(TUTORIAL_ON_NEW_GAME_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;
  return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === null;
}

export function setTutorialOnNewGame(enabled: boolean): void {
  window.localStorage.setItem(TUTORIAL_ON_NEW_GAME_KEY, enabled ? "1" : "0");
}

export function markTutorialSeenIfNeeded(): void {
  if (window.localStorage.getItem(TUTORIAL_ON_NEW_GAME_KEY) === "1") return;
  window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
}
