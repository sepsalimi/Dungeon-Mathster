import type { GameState } from "../game/types";
import { Hud } from "./Hud";
import { MathGrid } from "./MathGrid";
import { RoomScene } from "./RoomScene";

interface CombatViewProps {
  state: GameState;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onSubmitPath: (path: string[]) => void;
}

export function CombatView({ state, isMuted, onPause, onToggleMute, onSubmitPath }: CombatViewProps) {
  const lowHealth = state.player.hp <= state.player.maxHp * 0.3;
  const frozen = state.frozenUntil > Date.now();
  const hurtNonce = state.feedback?.kind === "enemy" ? state.feedback.nonce : null;
  const startHintId = state.player.revealStartTile ? state.puzzle?.answerPath[0] : null;

  return (
    <div className={["game-screen", lowHealth ? "game-screen--danger" : "", hurtNonce ? "game-screen--hurt" : ""].filter(Boolean).join(" ")}>
      <Hud state={state} isMuted={isMuted} onPause={onPause} onToggleMute={onToggleMute} />
      <RoomScene enemy={state.enemy} feedback={state.feedback} lowHealth={lowHealth} frozen={frozen} />
      {state.puzzle && <MathGrid puzzle={state.puzzle} startHintId={startHintId} onSubmitPath={onSubmitPath} />}
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
