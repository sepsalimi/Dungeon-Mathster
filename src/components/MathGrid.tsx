import { useEffect, useMemo, useRef, useState, type PointerEvent, type Touch, type TouchEvent } from "react";
import type { GridTile, PlayerState, Puzzle } from "../game/types";
import { SwipeGuide } from "./SwipeGuide";

interface MathGridProps {
  player: PlayerState;
  puzzle: Puzzle;
  startHintId?: string | null;
  guidePath?: string[] | null;
  highlightPlayerHealth?: boolean;
  onSubmitPath: (path: string[]) => void;
}

interface DragPoint {
  x: number;
  y: number;
}

const dragSampleSpacing = 12;

export function MathGrid({ player, puzzle, startHintId, guidePath, highlightPlayerHealth = false, onSubmitPath }: MathGridProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const selectedRef = useRef<string[]>([]);
  const activeInput = useRef<"pointer" | "touch" | null>(null);
  const activePointerId = useRef<number | null>(null);
  const activeTouchId = useRef<number | null>(null);
  const lastPoint = useRef<DragPoint | null>(null);
  const tileMap = useMemo(() => new Map(puzzle.tiles.map((tile) => [tile.id, tile])), [puzzle.tiles]);
  const hpPercent = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
  const displayedHp = player.temporaryHp > 0 ? `${player.hp}+${player.temporaryHp}` : String(player.hp);

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

  function startSwipe(tile: GridTile, point: DragPoint) {
    lastPoint.current = point;
    setSelectedPath(tile.type === "number" ? [tile.id] : []);
  }

  function resetSwipe() {
    activeInput.current = null;
    activePointerId.current = null;
    activeTouchId.current = null;
    lastPoint.current = null;
    setSelectedPath([]);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, tile: GridTile) {
    if (activeInput.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    activeInput.current = "pointer";
    activePointerId.current = event.pointerId;
    startSwipe(tile, { x: event.clientX, y: event.clientY });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (activeInput.current !== "pointer" || activePointerId.current !== event.pointerId) return;
    event.preventDefault();
    addTilesBetween({ x: event.clientX, y: event.clientY });
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
    startSwipe(tile, { x: touch.clientX, y: touch.clientY });
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (activeInput.current !== "touch") return;
    const touch = findActiveTouch(event.changedTouches);
    if (!touch) return;

    event.preventDefault();
    addTilesBetween({ x: touch.clientX, y: touch.clientY });
  }

  function finishTouchSwipe(event: TouchEvent<HTMLDivElement>) {
    if (activeInput.current !== "touch" || !findActiveTouch(event.changedTouches)) return;
    event.preventDefault();
    finishSwipe();
  }

  function findActiveTouch(touches: TouchEvent<Element>["changedTouches"]): Touch | null {
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (touch?.identifier === activeTouchId.current) return touch;
    }
    return null;
  }

  function finishSwipe() {
    const path = selectedRef.current;
    if (activeInput.current && path.length >= 3) onSubmitPath(path);
    resetSwipe();
  }

  function addTilesBetween(point: DragPoint) {
    const previous = lastPoint.current ?? point;
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    const steps = Math.max(1, Math.ceil(distance / dragSampleSpacing));

    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const id = findTileFromPoint(
        previous.x + (point.x - previous.x) * progress,
        previous.y + (point.y - previous.y) * progress,
      );
      if (id) addTile(id);
    }

    lastPoint.current = point;
  }

  return (
    <section className="math-panel" aria-label="Swipe math grid">
      <div className="target-card">
        <span>Make</span>
        <strong>{puzzle.target}</strong>
      </div>
      <div
        className={["player-health-card", highlightPlayerHealth ? "player-health-card--tutorial" : ""].filter(Boolean).join(" ")}
        aria-label={`Player HP ${player.hp} of ${player.maxHp}`}
      >
        <div className="player-health-label">
          <span>Player HP</span>
          <strong>
            {displayedHp}/{player.maxHp}
          </strong>
        </div>
        <div className="player-health-track">
          <div className="player-health-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        {player.lifesteal > 0 && (
          <div className="item-badge" aria-label={`Lifesteal heals ${player.lifesteal} HP per hit`}>
            Lifesteal +{player.lifesteal}
          </div>
        )}
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
        {guidePath && selected.length === 0 && <SwipeGuide tiles={puzzle.tiles} path={guidePath} size={puzzle.size} />}
      </div>
    </section>
  );
}
