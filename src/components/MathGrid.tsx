import { useEffect, useMemo, useRef, useState, type PointerEvent, type TouchEvent } from "react";
import type { GridTile, Puzzle } from "../game/types";

interface MathGridProps {
  puzzle: Puzzle;
  startHintId?: string | null;
  onSubmitPath: (path: string[]) => void;
}

export function MathGrid({ puzzle, startHintId, onSubmitPath }: MathGridProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const selectedRef = useRef<string[]>([]);
  const activeInput = useRef<"pointer" | "touch" | null>(null);
  const activePointerId = useRef<number | null>(null);
  const activeTouchId = useRef<number | null>(null);
  const tileMap = useMemo(() => new Map(puzzle.tiles.map((tile) => [tile.id, tile])), [puzzle.tiles]);

  useEffect(() => {
    resetSwipe();
  }, [puzzle.target, puzzle.tiles]);

  function addTile(id: string) {
    const current = selectedRef.current;
    const tile = tileMap.get(id);
    if (!tile || current.includes(id)) return;

    if (current.length === 0) {
      if (tile.type === "number") setSelectedPath([id]);
      return;
    }

    const last = tileMap.get(current[current.length - 1]);
    if (!last || Math.abs(last.row - tile.row) + Math.abs(last.col - tile.col) !== 1) return;

    const expectedType = current.length % 2 === 0 ? "number" : "operator";
    if (tile.type === expectedType) setSelectedPath([...current, id]);
  }

  function findTileFromPoint(clientX: number, clientY: number): string | null {
    const element = document.elementFromPoint(clientX, clientY);
    return element?.closest<HTMLElement>("[data-tile-id]")?.dataset.tileId ?? null;
  }

  function setSelectedPath(path: string[]) {
    selectedRef.current = path;
    setSelected(path);
  }

  function startSwipe(tile: GridTile) {
    setSelectedPath(tile.type === "number" ? [tile.id] : []);
  }

  function resetSwipe() {
    activeInput.current = null;
    activePointerId.current = null;
    activeTouchId.current = null;
    setSelectedPath([]);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, tile: GridTile) {
    if (activeInput.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    activeInput.current = "pointer";
    activePointerId.current = event.pointerId;
    startSwipe(tile);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (activeInput.current !== "pointer" || activePointerId.current !== event.pointerId) return;
    event.preventDefault();
    const id = findTileFromPoint(event.clientX, event.clientY);
    if (id) addTile(id);
  }

  function finishPointerSwipe(event: PointerEvent<HTMLDivElement>) {
    if (activeInput.current !== "pointer" || activePointerId.current !== event.pointerId) return;
    event.preventDefault();
    finishSwipe();
  }

  function handleTouchStart(event: TouchEvent<HTMLButtonElement>, tile: GridTile) {
    if (activeInput.current) return;
    const touch = event.changedTouches[0];
    if (!touch) return;

    event.preventDefault();
    activeInput.current = "touch";
    activeTouchId.current = touch.identifier;
    startSwipe(tile);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (activeInput.current !== "touch") return;
    const touch = findActiveTouch(event.changedTouches);
    if (!touch) return;

    event.preventDefault();
    const id = findTileFromPoint(touch.clientX, touch.clientY);
    if (id) addTile(id);
  }

  function finishTouchSwipe(event: TouchEvent<HTMLDivElement>) {
    if (activeInput.current !== "touch" || !findActiveTouch(event.changedTouches)) return;
    event.preventDefault();
    finishSwipe();
  }

  function findActiveTouch(touches: TouchList): Touch | null {
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (touch?.identifier === activeTouchId.current) return touch;
    }
    return null;
  }

  function finishSwipe() {
    const path = selectedRef.current;
    if (activeInput.current && path.length > 0) onSubmitPath(path);
    resetSwipe();
  }

  return (
    <section className="math-panel" aria-label="Swipe math grid">
      <div className="target-card">
        <span>Make</span>
        <strong>{puzzle.target}</strong>
      </div>
      <div
        className={`math-grid math-grid--${puzzle.size}`}
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerSwipe}
        onPointerCancel={finishPointerSwipe}
        onPointerLeave={finishPointerSwipe}
        onTouchMove={handleTouchMove}
        onTouchEnd={finishTouchSwipe}
        onTouchCancel={finishTouchSwipe}
      >
        {puzzle.tiles.map((tile) => {
          const selectedIndex = selected.indexOf(tile.id);
          const isSelected = selectedIndex >= 0;
          const isStartHint = tile.id === startHintId;
          return (
            <button
              key={tile.id}
              type="button"
              className={["math-tile", `math-tile--${tile.type}`, isSelected ? "is-selected" : "", isStartHint ? "is-start-hint" : ""]
                .filter(Boolean)
                .join(" ")}
              data-tile-id={tile.id}
              onPointerDown={(event) => handlePointerDown(event, tile)}
              onTouchStart={(event) => handleTouchStart(event, tile)}
            >
              <span>{tile.value}</span>
              {isStartHint && !isSelected && <b>Start</b>}
              {isSelected && <em>{selectedIndex + 1}</em>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
