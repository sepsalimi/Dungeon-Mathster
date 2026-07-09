// Tap-to-open tooltip for HUD item icons with live stat lines.
import { useEffect, useRef } from "react";
import type { ItemTooltipContent } from "../game/itemStats";

interface ItemTooltipProps {
  content: ItemTooltipContent;
  onClose: () => void;
}

export function ItemTooltip({ content, onClose }: ItemTooltipProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  return (
    <div className="item-tooltip" ref={panelRef} role="dialog" aria-label={`${content.name} details`}>
      <span className={`item-icon item-icon--${content.icon}`} aria-hidden="true" />
      <div className="item-tooltip__copy">
        <strong>{content.name}</strong>
        {content.count > 1 && <span className="item-tooltip__count">x{content.count}</span>}
        {content.statLine && <em>{content.statLine}</em>}
        <small>{content.description}</small>
      </div>
      <button className="item-tooltip__close" type="button" onClick={onClose} aria-label={`Close ${content.name} details`}>
        x
      </button>
    </div>
  );
}
