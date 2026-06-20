import type { CellState } from '@modules/puzzle';

function isCellResolved(solution: number[][], grid: CellState[][], x: number, y: number): boolean {
  const state = grid[y][x];
  if (state === 'empty') return false;
  const shouldFill = solution[y][x] === 1;
  if (state === 'fill') return shouldFill;
  if (state === 'mark') return !shouldFill;
  return false;
}

export function isRowResolved(solution: number[][], grid: CellState[][], row: number): boolean {
  const w = solution[row]?.length ?? 0;
  for (let x = 0; x < w; x++) {
    if (!isCellResolved(solution, grid, x, row)) return false;
  }
  return w > 0;
}

export function isColResolved(solution: number[][], grid: CellState[][], col: number): boolean {
  const h = solution.length;
  for (let y = 0; y < h; y++) {
    if (!isCellResolved(solution, grid, col, y)) return false;
  }
  return h > 0;
}

export function countSolutionFillCells(solution: number[][]): number {
  let n = 0;
  for (const row of solution) {
    for (const cell of row) {
      if (cell === 1) n++;
    }
  }
  return n;
}
