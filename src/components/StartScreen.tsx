import { useState } from "react";
import { disableTutorialPrompt, shouldAskTutorialPrompt } from "../game/settings";
import { TutorialStartPrompt } from "./TutorialStartPrompt";

interface StartScreenProps {
  onStart: (withTutorial: boolean) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const startNewRun = () => {
    if (shouldAskTutorialPrompt()) {
      setShowTutorialPrompt(true);
      return;
    }

    onStart(false);
  };

  const chooseTutorial = (withTutorial: boolean) => {
    if (dontAskAgain) disableTutorialPrompt();
    onStart(withTutorial);
  };

  return (
    <section className="start-screen">
      <div className="start-scene" aria-hidden="true">
        <div className="start-door" />
        <div className="start-floor" />
      </div>
      <div className="start-copy">
        <span>Floor 1</span>
        <h1>Dungeon Mathster</h1>
        <p>Swipe number paths, strike monsters, spend gold, and clear the first boss.</p>
        <button className="primary-action" type="button" onClick={startNewRun}>
          Start New Run
        </button>
      </div>
      {showTutorialPrompt && (
        <TutorialStartPrompt
          dontAskAgain={dontAskAgain}
          onChangeDontAskAgain={setDontAskAgain}
          onAccept={() => chooseTutorial(true)}
          onDecline={() => chooseTutorial(false)}
        />
      )}
    </section>
  );
}
