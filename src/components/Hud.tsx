import { useState } from "react";
import type { GameState, ItemId, SoundLevel } from "../game/types";
import { getItemTooltipContent } from "../game/itemStats";
import { getItemStacks } from "../game/progression";
import { ItemTooltip } from "./ItemTooltip";

interface HudProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
}

const soundLabels: Record<SoundLevel, string> = {
  mute: "Sound off",
  low: "Low sound",
  loud: "Loud sound",
};

export function Hud({ state, soundLevel, onPause, onCycleSoundLevel }: HudProps) {
  const items = getItemStacks(state.player);
  const highlightGold = state.tutorial === "gold" || state.tutorial === "shop" || state.tutorial === "healthBought";
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null);
  const selectedItem = selectedItemId ? getItemTooltipContent(selectedItemId, state.player) : null;

  const toggleItemDetails = (itemId: ItemId) => {
    setSelectedItemId((current) => (current === itemId ? null : itemId));
  };

  return (
    <header className={["hud", highlightGold ? "hud--gold-tutorial" : ""].filter(Boolean).join(" ")}>
      <div className="run-panel" aria-label={`Floor ${state.floor}, ${state.player.gold} gold`}>
        <div className="run-panel__topline">
          <span>Floor {state.floor}</span>
          <strong className={["gold-chip", highlightGold ? "gold-chip--tutorial" : ""].filter(Boolean).join(" ")}>
            <span className="coin-icon" aria-hidden="true">G</span>
            {state.player.gold}
          </strong>
        </div>
        <div className="item-list" aria-label={items.length ? `Items: ${items.map((item) => `${item.label} ${item.count}`).join(", ")}` : "Items: none"}>
          <small>Items</small>
          <div className="item-icons">
            {items.length === 0 && <span className="item-empty">None</span>}
            {items.map((item) => {
              const tooltip = getItemTooltipContent(item.id, state.player);
              const isSelected = selectedItemId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={["item-stack", isSelected ? "item-stack--selected" : ""].filter(Boolean).join(" ")}
                  aria-label={`${item.label}, ${tooltip.statLine ?? tooltip.description}`}
                  aria-expanded={isSelected}
                  onClick={() => toggleItemDetails(item.id)}
                >
                  <span className={`item-icon item-icon--${item.icon}`} aria-hidden="true" />
                  <b>{item.count}</b>
                </button>
              );
            })}
          </div>
        </div>
        {selectedItem && <ItemTooltip content={selectedItem} onClose={() => setSelectedItemId(null)} />}
      </div>
      <button className="hud-button" type="button" onClick={onCycleSoundLevel} aria-label={soundLabels[soundLevel]}>
        <span className={`sound-icon sound-icon--${soundLevel}`} aria-hidden="true">
          {soundLevel === "loud" && <i className="sound-icon__wave sound-icon__wave--outer" />}
        </span>
      </button>
      <button className="hud-button" type="button" onClick={onPause} aria-label="Pause game">
        <span aria-hidden="true">II</span>
      </button>
    </header>
  );
}
