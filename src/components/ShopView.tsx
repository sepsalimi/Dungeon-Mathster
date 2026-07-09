import { getUpgradeCost, shopUpgrades } from "../game/shop";
import type { GameState, ShopUpgradeId, SoundLevel } from "../game/types";
import { Hud } from "./Hud";

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
      <section className="shop-room" aria-label="Dungeon shop">
        <div className="merchant">
          <div className="merchant-sprite"><span /></div>
          <div><span className="eyebrow">Torch Shop</span><h1>Spend Gold</h1></div>
        </div>
        <div className="upgrade-list">
          {shopUpgrades.map((upgrade) => {
            const cost = getUpgradeCost(state.player, upgrade);
            const affordable = state.player.gold >= cost;
            return (
              <button key={upgrade.id} type="button" className="upgrade-row" onClick={() => onBuyUpgrade(upgrade.id)} disabled={!affordable}>
                <span><strong>{upgrade.name}</strong><small>{upgrade.description}</small></span>
                <em>{cost}g</em>
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
