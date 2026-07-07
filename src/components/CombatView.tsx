import type { GameState } from "../game/types";
import { Hud } from "./Hud";
import { MathGrid } from "./MathGrid";
import { RoomScene } from "./RoomScene";

interface CombatViewProps {
  state: GameState;
  onSubmitPath: (path: string[]) => void;
  onRestart: () => void;
}

export function CombatView({ state, onSubmitPath, onRestart }: CombatViewProps) {
  const lowHealth = state.player.hp <= state.player.maxHp * 0.3;
  const frozen = state.frozenUntil > Date.now();

  return (
    <div className={["game-screen", lowHealth ? "game-screen--danger" : ""].join(" ")}>
      <Hud state={state} onRestart={onRestart} />
      <RoomScene
        enemy={state.enemy}
        feedback={state.feedback}
        lowHealth={lowHealth}
        frozen={frozen}
      />
      {state.puzzle && <MathGrid puzzle={state.puzzle} onSubmitPath={onSubmitPath} />}
    </div>
  );
}
