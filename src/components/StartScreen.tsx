import { useState } from "react";
import { getTutorialOnNewGame, setTutorialOnNewGame } from "../game/settings";

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [tutorialOnNewGame, setTutorialOnNewGameState] = useState(getTutorialOnNewGame);

  const toggleTutorialOnNewGame = () => {
    const next = !tutorialOnNewGame;
    setTutorialOnNewGameState(next);
    setTutorialOnNewGame(next);
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
        <button className="primary-action" type="button" onClick={onStart}>
          Start New Run
        </button>
        <div className="start-settings">
          <span>Settings</span>
          <label className="settings-toggle">
            <input type="checkbox" checked={tutorialOnNewGame} onChange={toggleTutorialOnNewGame} />
            <span>New game with tutorial</span>
          </label>
        </div>
      </div>
    </section>
  );
}
