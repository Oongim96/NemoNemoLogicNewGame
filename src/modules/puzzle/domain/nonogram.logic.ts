export type CellState = 'empty' | 'fill' | 'mark';

export function computeLineClues(line: number[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (const cell of line) {
    if (cell === 1) {
      run++;
    } else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues.length > 0 ? clues : [0];
}

export function getRowClues(solution: number[][]): number[][] {
  return solution.map((row) => computeLineClues(row));
}

export function getColClues(solution: number[][]): number[][] {
  const cols = solution[0]?.length ?? 0;
  const clues: number[][] = [];
  for (let x = 0; x < cols; x++) {
    const col = solution.map((row) => row[x]);
    clues.push(computeLineClues(col));
  }
  return clues;
}

export function isSolutionComplete(solution: number[][], grid: CellState[][]): boolean {
  for (let y = 0; y < solution.length; y++) {
    for (let x = 0; x < solution[y].length; x++) {
      const shouldFill = solution[y][x] === 1;
      const isFill = grid[y][x] === 'fill';
      if (shouldFill !== isFill) return false;
    }
  }
  return true;
}

export function isCellCorrect(solution: number[][], grid: CellState[][], x: number, y: number): boolean | null {
  const state = grid[y][x];
  if (state === 'empty') return null;
  const shouldFill = solution[y][x] === 1;
  if (state === 'fill') return shouldFill;
  if (state === 'mark') return !shouldFill;
  return null;
}

export function createEmptyGrid(size: number): CellState[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty' as CellState));
}
