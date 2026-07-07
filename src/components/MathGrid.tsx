import { useEffect, useMemo, useState, type PointerEvent } from "react";
import type { GridTile, Puzzle } from "../game/types";

interface MathGridProps {
  puzzle: Puzzle;
  startHintId?: string | null;
  onSubmitPath: (path: string[]) => void;
}

export function MathGrid({ puzzle, startHintId, onSubmitPath }: MathGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const tileMap = useMemo(() => new Map(puzzle.tiles.map((tile) => [tile.id, tile])), [puzzle.tiles]);

  useEffect(() => {
    setSelected([]);
    setIsDragging(false);
  }, [puzzle.target, puzzle.tiles]);

  function addTile(id: string) {
    setSelected((current) => {
      const tile = tileMap.get(id);
      if (!tile || current.includes(id)) return current;
      if (current.length === 0) return tile.type === "number" ? [id] : current;

      const last = tileMap.get(current[current.length - 1]);
      if (!last || Math.abs(last.row - tile.row) + Math.abs(last.col - tile.col) !== 1) return current;

      const expectedType = current.length % 2 === 0 ? "number" : "operator";
      return tile.type === expectedType ? [...current, id] : current;
    });
  }

  function findTileFromPoint(clientX: number, clientY: number): string | null {
    const element = document.elementFromPoint(clientX, clientY);
    return element?.closest<HTMLElement>("[data-tile-id]")?.dataset.tileId ?? null;
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, tile: GridTile) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setSelected([]);
    if (tile.type === "number") setSelected([tile.id]);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const id = findTileFromPoint(event.clientX, event.clientY);
    if (id) addTile(id);
  }

  function finishSwipe() {
    if (isDragging && selected.length > 0) onSubmitPath(selected);
    setSelected([]);
    setIsDragging(false);
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
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        onPointerLeave={finishSwipe}
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
