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
      <span>{won ? "Boss Relic Claimed" : "Run Ended"}</span>
      <h1>{won ? "Lifesteal Found" : "GAME OVER"}</h1>
      <p>
        {won
          ? `You cleared Floor 1 and gained Lifesteal +${state.player.lifesteal}: heal on every successful attack.`
          : "The dungeon claimed this run. Start again and cut deeper."}
      </p>
      <button className="primary-action" type="button" onClick={onRestart}>Start New Run</button>
    </section>
  );
}
