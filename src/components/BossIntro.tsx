import type { GameState, SoundLevel } from "../game/types";
import { Hud } from "./Hud";

interface BossIntroProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onContinue: () => void;
}

export function BossIntro({ state, soundLevel, onPause, onCycleSoundLevel, onContinue }: BossIntroProps) {
  return (
    <div className="game-screen">
      <Hud gold={state.player.gold} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <section className="boss-intro">
        <div className="boss-portrait">
          <span className="boss-eye boss-eye--left" />
          <span className="boss-eye boss-eye--right" />
        </div>
        <div className="dialog-box">
          <span>Floor 1 Boss</span>
          <h1>{state.enemy?.name ?? "Count Calculus"}</h1>
          <p>Three rooms brought you here, little solver. My grid is larger, and my sums bite harder.</p>
          <button className="primary-action" type="button" onClick={onContinue}>Face the Boss</button>
        </div>
      </section>
    </div>
  );
}
