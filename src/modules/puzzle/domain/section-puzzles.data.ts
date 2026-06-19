import type { SectionPuzzleData } from '@modules/puzzle/domain/puzzle.types';

/** 3×3 맵 — 구역당 3×3 네모네모. 합치면 용 얼굴 실루엣 */
const SOLUTIONS: number[][][] = [
  [
    [1, 1, 0],
    [1, 0, 0],
    [0, 0, 0],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 1, 1],
    [0, 0, 1],
    [0, 0, 0],
  ],
  [
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 0, 1],
    [0, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [
    [0, 0, 0],
    [0, 0, 1],
    [0, 1, 1],
  ],
];

const PIECE_COLORS = [
  0x5a8fd9, 0x7c5cff, 0x5a8fd9,
  0x4a7fc9, 0x9b7fff, 0x4a7fc9,
  0x3a6fb9, 0x7c5cff, 0x3a6fb9,
];

const LABELS = [
  '왼쪽 귀', '뿔', '오른쪽 귀',
  '왼쪽 눈', '주둥이', '오른쪽 눈',
  '왼쪽 턱', '입', '오른쪽 턱',
];

export const MAP_SIZE = 3;
export const SECTION_COUNT = MAP_SIZE * MAP_SIZE;
export const PUZZLE_SIZE = 3;

export const SECTION_PUZZLES: SectionPuzzleData[] = SOLUTIONS.map((solution, sectionIndex) => ({
  sectionIndex,
  label: LABELS[sectionIndex],
  solution,
  pieceColor: PIECE_COLORS[sectionIndex],
}));

export function getSectionPuzzle(sectionIndex: number): SectionPuzzleData {
  const idx = sectionIndex % SECTION_PUZZLES.length;
  const base = SECTION_PUZZLES[idx];
  return {
    ...base,
    sectionIndex,
    label: base.label ?? `구역 ${sectionIndex + 1}`,
  };
}
