import type { GameState, SoundLevel } from "../game/types";
import { getBossDefinition } from "../game/progression";
import { Hud } from "./Hud";

interface BossIntroProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onContinue: () => void;
}

export function BossIntro({ state, soundLevel, onPause, onCycleSoundLevel, onContinue }: BossIntroProps) {
  const boss = getBossDefinition(state.floor);

  return (
    <div className="game-screen">
      <Hud state={state} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <section className="boss-intro">
        <div className="boss-portrait">
          <span className="boss-eye boss-eye--left" />
          <span className="boss-eye boss-eye--right" />
        </div>
        <div className="dialog-box">
          <span>Floor {state.floor} Boss</span>
          <h1>{state.enemy?.name ?? boss.name}</h1>
          <p>{boss.intro}</p>
          <button className="primary-action" type="button" onClick={onContinue}>Face the Boss</button>
        </div>
      </section>
    </div>
  );
}
