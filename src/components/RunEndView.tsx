import type { GameState } from "../game/types";

interface RunEndViewProps {
  state: GameState;
  onRestart: () => void;
}

export function RunEndView({ state, onRestart }: RunEndViewProps) {
  const won = state.phase === "victory";

  return (
    <section className={`end-screen ${won ? "end-screen--victory" : "end-screen--defeat"}`}>
      <div className="end-sigil" />
      <span>{won ? "MVP Loop Complete" : "Run Ended"}</span>
      <h1>{won ? "Floor 1 Cleared" : "GAME OVER"}</h1>
      <p>
        {won
          ? `You defeated the boss with ${state.player.hp} HP and ${state.player.gold} gold.`
          : "The dungeon claimed this run. Start again and cut deeper."}
      </p>
      <button className="primary-action" type="button" onClick={onRestart}>
        Start New Run
      </button>
    </section>
  );
}
