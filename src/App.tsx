import { BossIntro } from "./components/BossIntro";
import { BargainView } from "./components/BargainView";
import { CombatView } from "./components/CombatView";
import { DoorChoiceView } from "./components/DoorChoiceView";
import { PauseOverlay } from "./components/PauseOverlay";
import { RunEndView } from "./components/RunEndView";
import { ShopView } from "./components/ShopView";
import { StartScreen } from "./components/StartScreen";
import { useGame } from "./game/useGame";

export default function App() {
  const game = useGame();

  return (
    <main className="app-shell">
      {game.state.phase === "start" && <StartScreen onStart={game.startRun} />}
      {game.state.phase === "combat" && (
        <CombatView state={game.state} onSubmitPath={game.submitPath} onRestart={game.startRun} />
      )}
      {game.state.phase === "door" && (
        <DoorChoiceView state={game.state} onChooseDoor={game.chooseDoor} onRestart={game.startRun} />
      )}
      {game.state.phase === "shop" && (
        <ShopView state={game.state} onBuyUpgrade={game.buyUpgrade} onContinue={game.leaveShop} onRestart={game.startRun} />
      )}
      {game.state.phase === "bargain" && (
        <BargainView state={game.state} onTakeBargain={game.takeBargain} onRestart={game.startRun} />
      )}
      {game.state.phase === "bossIntro" && (
        <BossIntro state={game.state} onContinue={game.startBossFight} onRestart={game.startRun} />
      )}
      {(game.state.phase === "victory" || game.state.phase === "defeat") && (
        <RunEndView state={game.state} onRestart={game.startRun} />
      )}
      {game.state.paused && <PauseOverlay onResume={game.resumeGame} onRestart={game.startRun} />}
    </main>
  );
}
