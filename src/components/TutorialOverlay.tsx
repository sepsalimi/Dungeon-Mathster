// Floating tutorial banner shown during the first run. Displays the copy for
// the current step and a skip button so the walkthrough is never forced.
import { tutorialCopy } from "../game/tutorial";
import type { TutorialStep } from "../game/types";

interface TutorialOverlayProps {
  step: TutorialStep;
  target?: number | null;
  onSkip: () => void;
}

export function TutorialOverlay({ step, target, onSkip }: TutorialOverlayProps) {
  const copy = tutorialCopy[step];
  const position = step === "door" ? "bottom" : step === "shop" ? "shop" : "top";

  return (
    <aside className={`tutorial-banner tutorial-banner--${position}`} aria-label="Tutorial">
      <div className="tutorial-banner__text">
        <span>{copy.title}</span>
        {target !== null && target !== undefined && (
          <strong className="tutorial-banner__target">Make {target}</strong>
        )}
        <p>{copy.message}</p>
      </div>
      <button className="tutorial-skip" type="button" onClick={onSkip}>
        Skip tutorial
      </button>
    </aside>
  );
}
