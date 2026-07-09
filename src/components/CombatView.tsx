import { useMemo } from "react";
import type { GameState, SoundLevel } from "../game/types";
import { Hud } from "./Hud";
import { MathGrid } from "./MathGrid";
import { RewardCue } from "./RewardCue";
import { RoomScene } from "./RoomScene";

interface CombatViewProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onSubmitPath: (path: string[]) => void;
}

export function CombatView({ state, soundLevel, onPause, onCycleSoundLevel, onSubmitPath }: CombatViewProps) {
  const lowHealth = state.player.hp <= state.player.maxHp * 0.3;
  const frozen = state.frozenUntil > Date.now();
  const hurtNonce = state.feedback?.kind === "enemy" ? state.feedback.nonce : null;
  const highlightEnemyHealth = state.tutorial === "finish" || state.tutorial === "killEnemy";
  const highlightPlayerHealth = state.tutorial === "enemyHit";
  const guidePath = state.tutorial === "swipe" || state.tutorial === "killEnemy" ? state.puzzle?.answerPath : null;
  const startHintId = useMemo(() => {
    if (!state.puzzle || state.player.oracleLensChance <= 0) return null;
    return Math.random() < state.player.oracleLensChance ? state.puzzle.answerPath[0] : null;
  }, [state.puzzle?.target, state.puzzle?.answerPath[0], state.player.oracleLensChance]);

  return (
    <div className={["game-screen", lowHealth ? "game-screen--danger" : "", hurtNonce ? "game-screen--hurt" : ""].filter(Boolean).join(" ")}>
      <Hud state={state} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <RewardCue feedback={state.feedback} />
      <RoomScene
        enemy={state.enemy}
        feedback={state.feedback}
        lowHealth={lowHealth}
        frozen={frozen}
        highlightEnemyHealth={highlightEnemyHealth}
      />
      {state.puzzle && (
        <MathGrid
          player={state.player}
          puzzle={state.puzzle}
          startHintId={startHintId}
          guidePath={guidePath}
          highlightPlayerHealth={highlightPlayerHealth}
          onSubmitPath={onSubmitPath}
        />
      )}
      {hurtNonce && state.enemy && (
        <div
          key={`enemy-overlay-${hurtNonce}`}
          className={["enemy-attack-overlay", state.enemy.isBoss ? "enemy-attack-overlay--boss" : ""].filter(Boolean).join(" ")}
        >
          <div className="enemy-attack-sprite">
            <span className="enemy-attack-horn enemy-attack-horn--left" />
            <span className="enemy-attack-horn enemy-attack-horn--right" />
            <span className="enemy-attack-eye enemy-attack-eye--left" />
            <span className="enemy-attack-eye enemy-attack-eye--right" />
            <span className="enemy-attack-mouth" />
          </div>
        </div>
      )}
      {hurtNonce && <div key={`screen-hurt-${hurtNonce}`} className="hurt-flash" />}
    </div>
  );
}
