import { bargainOptions, getBargainDownside } from "../game/shop";
import type { BargainId, GameState, SoundLevel } from "../game/types";
import { Hud } from "./Hud";
import { PlayerVitals } from "./PlayerVitals";
import { RewardCue } from "./RewardCue";

interface BargainViewProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onTakeBargain: (id: BargainId) => void;
}

export function BargainView({ state, soundLevel, onPause, onCycleSoundLevel, onTakeBargain }: BargainViewProps) {
  return (
    <div className="game-screen">
      <Hud state={state} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <RewardCue feedback={state.feedback} />
      <section className="bargain-room" aria-label="Cursed bargain room">
        <div className="altar-sprite" aria-hidden="true"><span /></div>
        <div className="bargain-copy"><span>Cursed Altar</span><h1>Power Has a Price</h1></div>
        <PlayerVitals player={state.player} />
        <div className="bargain-list">
          {bargainOptions.map((option) => (
            <button key={option.id} type="button" className="bargain-card" onClick={() => onTakeBargain(option.id)}>
              <strong>{option.name}</strong>
              <span className="bargain-upside">{option.upside}</span>
              <span className="bargain-downside">{getBargainDownside(state.player, option.id)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
