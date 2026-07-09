import type { GameState, SoundLevel } from "../game/types";
import { getItemStacks } from "../game/progression";

interface HudProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
}

const soundLabels: Record<SoundLevel, string> = {
  mute: "Sound off",
  low: "Low sound",
  loud: "Loud sound",
};

export function Hud({ state, soundLevel, onPause, onCycleSoundLevel }: HudProps) {
  const items = getItemStacks(state.player);

  return (
    <header className="hud">
      <div className="run-panel" aria-label={`Floor ${state.floor}, ${state.player.gold} gold`}>
        <div className="run-panel__topline">
          <span>Floor {state.floor}</span>
          <strong className={["gold-chip", state.tutorial === "gold" ? "gold-chip--tutorial" : ""].filter(Boolean).join(" ")}>
            <span className="coin-icon" aria-hidden="true">G</span>
            {state.player.gold}
          </strong>
        </div>
        <div className="item-list" aria-label={items.length ? `Items: ${items.map((item) => `${item.label} ${item.count}`).join(", ")}` : "Items: none"}>
          <small>Items</small>
          <div className="item-icons">
            {items.length === 0 && <span className="item-empty">None</span>}
            {items.map((item) => (
              <span key={item.id} className="item-stack" title={`${item.label} x${item.count}`}>
                <span className={`item-icon item-icon--${item.icon}`} aria-hidden="true" />
                <b>{item.count}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
      <button className="hud-button" type="button" onClick={onCycleSoundLevel} aria-label={soundLabels[soundLevel]}>
        <span className={`sound-icon sound-icon--${soundLevel}`} aria-hidden="true">
          {soundLevel === "loud" && <i className="sound-icon__wave sound-icon__wave--outer" />}
        </span>
      </button>
      <button className="hud-button" type="button" onClick={onPause} aria-label="Pause game">
        <span aria-hidden="true">II</span>
      </button>
    </header>
  );
}
