import type { GridTile, Puzzle } from "./types";

const positiveNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const mixedNumbers = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface PuzzleOptions {
  allowNegative?: boolean;
}

export function makePuzzle(size: number, options: PuzzleOptions = {}): Puzzle {
  const numberRange = options.allowNegative ? mixedNumbers : positiveNumbers;
  const pathLength = size === 3 ? 3 : 7;
  const answerPath = buildAnswerPath(size, pathLength);
  const pathNumbers = new Map<string, number>();

  answerPath.forEach((id, index) => {
    if (index % 2 === 0) {
      pathNumbers.set(id, pick(numberRange));
    }
  });

  const tiles: GridTile[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const id = tileId(row, col);
      const isNumber = (row + col) % 2 === 0;
      tiles.push({
        id,
        row,
        col,
        type: isNumber ? "number" : "operator",
        value: isNumber ? String(pathNumbers.get(id) ?? pick(numberRange)) : "+",
      });
    }
  }

  const target = evaluatePath(answerPath, tiles) ?? 0;
  return { size, target, tiles, answerPath };
}

export function evaluatePath(path: string[], tiles: GridTile[]): number | null {
  if (!isValidPathShape(path, tiles)) {
    return null;
  }

  return path.reduce((sum, id) => {
    const tile = tiles.find((candidate) => candidate.id === id);
    return tile?.type === "number" ? sum + Number(tile.value) : sum;
  }, 0);
}

export function isCorrectPath(path: string[], tiles: GridTile[], target: number): boolean {
  return evaluatePath(path, tiles) === target;
}

export function isValidPathShape(path: string[], tiles: GridTile[]): boolean {
  if (path.length < 3 || path.length % 2 === 0) {
    return false;
  }

  const seen = new Set<string>();
  const tileMap = new Map(tiles.map((tile) => [tile.id, tile]));

  for (let index = 0; index < path.length; index += 1) {
    const id = path[index];
    const tile = tileMap.get(id);

    if (!tile || seen.has(id)) {
      return false;
    }

    const expectedType = index % 2 === 0 ? "number" : "operator";
    if (tile.type !== expectedType) {
      return false;
    }

    const previous = index > 0 ? tileMap.get(path[index - 1]) : null;
    if (previous && manhattanDistance(previous, tile) !== 1) {
      return false;
    }

    seen.add(id);
  }

  return true;
}

export function tileId(row: number, col: number): string {
  return `${row}-${col}`;
}

function buildAnswerPath(size: number, pathLength: number): string[] {
  const starts = allNumberCells(size).sort(() => Math.random() - 0.5);

  for (const start of starts) {
    const path = walkPath(size, [start], pathLength);
    if (path) {
      return path.map(([row, col]) => tileId(row, col));
    }
  }

  return fallbackPath(size).slice(0, pathLength).map(([row, col]) => tileId(row, col));
}

function walkPath(size: number, path: Array<[number, number]>, pathLength: number): Array<[number, number]> | null {
  if (path.length === pathLength) {
    return path;
  }

  const [row, col] = path[path.length - 1];
  const used = new Set(path.map(([usedRow, usedCol]) => tileId(usedRow, usedCol)));
  const nextCells = neighbors(row, col, size)
    .filter(([nextRow, nextCol]) => !used.has(tileId(nextRow, nextCol)))
    .sort(() => Math.random() - 0.5);

  for (const cell of nextCells) {
    const nextPath = walkPath(size, [...path, cell], pathLength);
    if (nextPath) {
      return nextPath;
    }
  }

  return null;
}

function neighbors(row: number, col: number, size: number): Array<[number, number]> {
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ].filter(
    ([nextRow, nextCol]) => nextRow >= 0 && nextCol >= 0 && nextRow < size && nextCol < size,
  ) as Array<[number, number]>;
}

function allNumberCells(size: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if ((row + col) % 2 === 0) {
        cells.push([row, col]);
      }
    }
  }
  return cells;
}

function fallbackPath(size: number): Array<[number, number]> {
  if (size === 3) {
    return [[0, 0], [0, 1], [0, 2]];
  }

  return [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3]];
}

function manhattanDistance(a: GridTile, b: GridTile): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function pick(values: number[]): number {
  return values[Math.floor(Math.random() * values.length)];
}
