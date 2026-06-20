import type { PuzzleSet } from '@modules/puzzle/domain/puzzle-sets/puzzle-set.types';
import type { SectionPuzzleData } from '@modules/puzzle/domain/puzzle.types';

/** 3×3 맵 — 구역당 3×3. 합치면 9×9 용 실루엣 */
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

const SECTIONS: SectionPuzzleData[] = SOLUTIONS.map((solution, sectionIndex) => ({
  sectionIndex,
  label: LABELS[sectionIndex],
  solution,
  pieceColor: PIECE_COLORS[sectionIndex],
}));

export const DRAGON_3X3_SET: PuzzleSet = {
  id: 'dragon_3x3',
  pictureSize: 9,
  puzzleSize: 3,
  mapSize: 3,
  sections: SECTIONS,
};

/** @deprecated dragon_3x3 사용 */
export const MAP_SIZE = 3;
export const SECTION_COUNT = 9;
export const PUZZLE_SIZE = 3;
export const SECTION_PUZZLES = SECTIONS;
