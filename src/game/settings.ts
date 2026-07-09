// Persisted start-screen preferences.
const TUTORIAL_PROMPT_DISABLED_KEY = "dungeon-mathster-tutorial-prompt-disabled";

export function shouldAskTutorialPrompt(): boolean {
  return window.localStorage.getItem(TUTORIAL_PROMPT_DISABLED_KEY) !== "1";
}

export function disableTutorialPrompt(): void {
  window.localStorage.setItem(TUTORIAL_PROMPT_DISABLED_KEY, "1");
}
