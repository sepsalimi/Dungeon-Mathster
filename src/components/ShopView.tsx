import { shopUpgrades } from "../game/content";
import type { GameState, ShopUpgradeId, SoundLevel } from "../game/types";
import { Hud } from "./Hud";
import { PlayerVitals } from "./PlayerVitals";

interface ShopViewProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onBuyUpgrade: (id: ShopUpgradeId) => void;
  onContinue: () => void;
}

export function ShopView({ state, soundLevel, onPause, onCycleSoundLevel, onBuyUpgrade, onContinue }: ShopViewProps) {
  return (
    <div className="game-screen">
      <Hud state={state} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <section
        className={state.tutorial === "shop" ? "shop-room shop-room--tutorial" : "shop-room"}
        aria-label="Dungeon shop"
      >
        <div className="merchant">
          <div className="merchant-sprite"><span /></div>
          <div><span className="eyebrow">Torch Shop</span><h1>Spend Gold</h1></div>
        </div>
        <PlayerVitals player={state.player} />
        <div className="upgrade-list">
          {shopUpgrades.map((upgrade) => {
            const affordable = state.player.gold >= upgrade.cost;
            return (
              <button key={upgrade.id} type="button" className="upgrade-row" onClick={() => onBuyUpgrade(upgrade.id)} disabled={!affordable}>
                <span><strong>{upgrade.name}</strong><small>{upgrade.description}</small></span>
                <em>{upgrade.cost}g</em>
              </button>
            );
          })}
        </div>
        {state.feedback && <p className="shop-toast">{state.feedback.message}</p>}
        <button className="primary-action" type="button" onClick={onContinue}>Venture Onward</button>
      </section>
    </div>
  );
}
