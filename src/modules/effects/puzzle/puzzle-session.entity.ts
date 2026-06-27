import type { CellState } from '@modules/puzzle';
import { countSolutionFillCells } from '@modules/effects/puzzle/puzzle-line.logic';

/** 구역(퍼즐) 1판 세션 상태 */
export class PuzzleSession {
  readonly totalFillCells: number;
  private resolvedLines = new Set<string>();
  comboStreak = 0;
  sectionMistakes = 0;
  correctPlacements = 0;

  constructor(solution: number[][]) {
    this.totalFillCells = countSolutionFillCells(solution);
  }

  comboShield = 0;

  markLineResolved(axis: 'row' | 'col', index: number): boolean {
    const key = `${axis}:${index}`;
    if (this.resolvedLines.has(key)) return false;
    this.resolvedLines.add(key);
    return true;
  }

  onCorrectPlacement(): void {
    this.correctPlacements++;
    this.comboStreak++;
  }

  onMistake(): void {
    this.sectionMistakes++;
    if (this.comboShield > 0) {
      this.comboShield--;
      return;
    }
    this.comboStreak = 0;
  }

  grantComboShield(amount: number): void {
    if (amount > 0) this.comboShield += amount;
  }

  /** 90%+ 완성률 — 실수가 채울 칸의 10% 이하 */
  meetsHighCompletion(): boolean {
    if (this.totalFillCells <= 0) return true;
    return this.sectionMistakes / this.totalFillCells <= 0.1;
  }

  getCompletionRate(): number {
    if (this.totalFillCells <= 0) return 1;
    return Math.max(0, 1 - this.sectionMistakes / this.totalFillCells);
  }
}

export function pickRandomUnresolvedCells(
  solution: number[][],
  grid: CellState[][],
  count: number,
): { x: number; y: number }[] {
  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < solution.length; y++) {
    for (let x = 0; x < solution[y].length; x++) {
      if (grid[y][x] === 'empty') candidates.push({ x, y });
    }
  }
  const picked: { x: number; y: number }[] = [];
  const pool = [...candidates];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]!);
  }
  return picked;
}

export function pickAdjacentUnresolved(
  solution: number[][],
  grid: CellState[][],
  cx: number,
  cy: number,
  count: number,
): { x: number; y: number }[] {
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  const candidates: { x: number; y: number }[] = [];
  for (const [dx, dy] of dirs) {
    const x = cx + dx;
    const y = cy + dy;
    if (y >= 0 && y < solution.length && x >= 0 && x < solution[y].length && grid[y][x] === 'empty') {
      candidates.push({ x, y });
    }
  }
  const picked: { x: number; y: number }[] = [];
  const pool = [...candidates];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]!);
  }
  return picked;
}

export function pickCrossUnresolved(
  solution: number[][],
  grid: CellState[][],
  cx: number,
  cy: number,
  range: number,
): { x: number; y: number }[] {
  const picked: { x: number; y: number }[] = [];
  for (let d = -range; d <= range; d++) {
    if (d === 0) continue;
    const cols = [
      { x: cx + d, y: cy },
      { x: cx, y: cy + d },
    ];
    for (const { x, y } of cols) {
      if (y >= 0 && y < solution.length && x >= 0 && x < solution[y].length && grid[y][x] === 'empty') {
        picked.push({ x, y });
      }
    }
  }
  return picked;
}
