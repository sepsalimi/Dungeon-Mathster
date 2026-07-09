// Floating tutorial banner shown during the first run. Step classes let the
// banner line up with the red tutorial pointers without forcing the walkthrough.
import { tutorialCopy } from "../game/tutorial";
import type { TutorialStep } from "../game/types";

interface TutorialOverlayProps {
  step: TutorialStep;
  onSkip: () => void;
}

export function TutorialOverlay({ step, onSkip }: TutorialOverlayProps) {
  const copy = tutorialCopy[step];
  const position = step === "door" ? "bottom" : step === "shop" ? "shop" : "top";

  return (
    <aside className={`tutorial-banner tutorial-banner--${position} tutorial-banner--${step}`} aria-label="Tutorial">
      <div className="tutorial-banner__text">
        <span>{copy.title}</span>
        <p>{copy.message}</p>
      </div>
      <button className="tutorial-skip" type="button" onClick={onSkip}>
        Skip tutorial
      </button>
    </aside>
  );
}
