// Animated swipe hint drawn over the math grid during the tutorial. Traces the
// answer path with a dashed line and a fingertip dot so the player sees the
// exact swipe to make.
import { useMemo } from "react";
import type { GridTile } from "../game/types";

interface SwipeGuideProps {
  tiles: GridTile[];
  path: string[];
  size: number;
}

export function SwipeGuide({ tiles, path, size }: SwipeGuideProps) {
  const pathData = useMemo(() => {
    const tileMap = new Map(tiles.map((tile) => [tile.id, tile]));
    return path
      .map((id, index) => {
        const tile = tileMap.get(id);
        if (!tile) return "";
        const x = ((tile.col + 0.5) / size) * 100;
        const y = ((tile.row + 0.5) / size) * 100;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [tiles, path, size]);

  return (
    <svg className="swipe-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path className="swipe-guide__trail" d={pathData} />
      <circle className="swipe-guide__finger" r="4.5">
        <animateMotion dur="1.8s" repeatCount="indefinite" path={pathData} keyTimes="0;0.8;1" keyPoints="0;1;1" calcMode="linear" />
      </circle>
    </svg>
  );
}
