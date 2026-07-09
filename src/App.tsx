import { BossIntro } from "./components/BossIntro";
import { BargainView } from "./components/BargainView";
import { CombatView } from "./components/CombatView";
import { DoorChoiceView } from "./components/DoorChoiceView";
import { FloorIntroView } from "./components/FloorIntroView";
import { PauseOverlay } from "./components/PauseOverlay";
import { RunEndView } from "./components/RunEndView";
import { ShopView } from "./components/ShopView";
import { StartScreen } from "./components/StartScreen";
import { TutorialOverlay } from "./components/TutorialOverlay";
import { useGame } from "./game/useGame";

export default function App() {
  const game = useGame();
  const hudControls = {
    soundLevel: game.soundLevel,
    onPause: game.pauseGame,
    onCycleSoundLevel: game.cycleSoundLevel,
  };

  return (
    <main className="app-shell">
      {game.state.phase === "start" && <StartScreen onStart={game.startRun} />}
      {game.state.phase === "floorIntro" && (
        <FloorIntroView
          key={game.state.floorIntroNonce}
          floor={game.state.floor}
          showScroll={game.state.showFloorScroll}
          onReady={game.confirmFloorReady}
        />
      )}
      {game.state.phase === "combat" && (
        <CombatView state={game.state} onSubmitPath={game.submitPath} {...hudControls} />
      )}
      {game.state.phase === "door" && (
        <DoorChoiceView state={game.state} onChooseDoor={game.chooseDoor} {...hudControls} />
      )}
      {game.state.phase === "shop" && (
        <ShopView state={game.state} onBuyUpgrade={game.buyUpgrade} onContinue={game.leaveShop} {...hudControls} />
      )}
      {game.state.phase === "bargain" && (
        <BargainView state={game.state} onTakeBargain={game.takeBargain} {...hudControls} />
      )}
      {game.state.phase === "bossIntro" && (
        <BossIntro
          state={game.state}
          onDialogTick={game.playBossDialogTick}
          onContinue={game.startBossFight}
          {...hudControls}
        />
      )}
      {(game.state.phase === "victory" || game.state.phase === "defeat") && (
        <RunEndView state={game.state} onRestart={() => game.startRun(false)} />
      )}
      {game.state.tutorial && game.state.phase === "combat" && !game.state.paused && (
        <TutorialOverlay step={game.state.tutorial} onSkip={game.skipTutorial} />
      )}
      {game.state.paused && (
        <PauseOverlay onResume={game.resumeGame} onRestart={() => game.startRun(false)} />
      )}
    </main>
  );
}
