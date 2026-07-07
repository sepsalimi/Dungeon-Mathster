import type { GameState } from "../game/types";
import { Hud } from "./Hud";

interface BossIntroProps {
  state: GameState;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onContinue: () => void;
}

export function BossIntro({ state, isMuted, onPause, onToggleMute, onContinue }: BossIntroProps) {
  return (
    <div className="game-screen">
      <Hud state={state} isMuted={isMuted} onPause={onPause} onToggleMute={onToggleMute} />
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
