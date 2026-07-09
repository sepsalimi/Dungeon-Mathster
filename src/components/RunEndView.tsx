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
      <span>{won ? "Dungeon Cleared" : "Run Ended"}</span>
      <h1>{won ? "BEDMAS MASTERED" : "GAME OVER"}</h1>
      <p>
        {won
          ? `You cleared Floor ${state.floor} with ${state.player.gold} gold and ${state.player.relics.length} relics.`
          : "The dungeon claimed this run. Start again and cut deeper."}
      </p>
      <button className="primary-action" type="button" onClick={onRestart}>Start New Run</button>
    </section>
  );
}
