import { useState } from "react";
import type { GameState, SoundLevel } from "../game/types";
import { getBossDefinition } from "../game/progression";
import { Hud } from "./Hud";
import { TalkingDialogText } from "./TalkingDialogText";

interface BossIntroProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onDialogTick: (index: number, character: string) => void;
  onContinue: () => void;
}

export function BossIntro({ state, soundLevel, onPause, onCycleSoundLevel, onDialogTick, onContinue }: BossIntroProps) {
  const boss = getBossDefinition(state.floor);
  const [isTalking, setIsTalking] = useState(false);

  return (
    <div className="game-screen">
      <Hud state={state} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <section className="boss-intro">
        <div className={`boss-portrait${isTalking ? " boss-portrait--talking" : ""}`}>
          <span className="boss-eye boss-eye--left" />
          <span className="boss-eye boss-eye--right" />
          <span className="boss-mouth" />
          <span className="boss-talk-wave boss-talk-wave--one" />
          <span className="boss-talk-wave boss-talk-wave--two" />
        </div>
        <div className="dialog-box">
          <span>Floor {state.floor} Boss</span>
          <h1>{state.enemy?.name ?? boss.name}</h1>
          <TalkingDialogText text={boss.intro} onSpeakTick={onDialogTick} onTalkingChange={setIsTalking} />
          <button className="primary-action" type="button" onClick={onContinue}>Face the Boss</button>
        </div>
      </section>
    </div>
  );
}
