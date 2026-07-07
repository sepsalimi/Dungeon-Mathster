import { bargainOptions } from "../game/content";
import type { BargainId, GameState } from "../game/types";
import { Hud } from "./Hud";

interface BargainViewProps {
  state: GameState;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onTakeBargain: (id: BargainId) => void;
}

export function BargainView({ state, isMuted, onPause, onToggleMute, onTakeBargain }: BargainViewProps) {
  return (
    <div className="game-screen">
      <Hud state={state} isMuted={isMuted} onPause={onPause} onToggleMute={onToggleMute} />
      <section className="bargain-room" aria-label="Cursed bargain room">
        <div className="altar-sprite" aria-hidden="true"><span /></div>
        <div className="bargain-copy"><span>Cursed Altar</span><h1>Power Has a Price</h1></div>
        <div className="bargain-list">
          {bargainOptions.map((option) => (
            <button key={option.id} type="button" className="bargain-card" onClick={() => onTakeBargain(option.id)}>
              <strong>{option.name}</strong>
              <span className="bargain-upside">{option.upside}</span>
              <span className="bargain-downside">{option.downside}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
