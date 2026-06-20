import type { SectionPuzzleData } from '@modules/puzzle/domain/puzzle.types';

export interface PuzzleSet {
  id: string;
  /** 합쳐진 큰 그림 한 변 (mapSize × puzzleSize) */
  pictureSize: number;
  puzzleSize: number;
  mapSize: number;
  sections: SectionPuzzleData[];
}

/** 10×10 잉크 슬라임 — 2×2 구역, 구역당 5×5 */
const SLIME_MASTER_10: number[][] = [
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
];

const SLIME_QUADRANT_LABELS = ['왼쪽 위', '오른쪽 위', '왼쪽 아래', '오른쪽 아래'];

const SLIME_QUADRANT_COLORS = [0x4a9a6a, 0x5aad7a, 0x3d8a5a, 0x6bc08a];

function extractPiece(master: number[][], mapRow: number, mapCol: number, pieceSize: number): number[][] {
  const piece: number[][] = [];
  for (let y = 0; y < pieceSize; y++) {
    const row: number[] = [];
    for (let x = 0; x < pieceSize; x++) {
      row.push(master[mapRow * pieceSize + y][mapCol * pieceSize + x]);
    }
    piece.push(row);
  }
  return piece;
}

function buildSlimeSections(): SectionPuzzleData[] {
  const mapSize = 2;
  const pieceSize = 5;
  const sections: SectionPuzzleData[] = [];

  for (let row = 0; row < mapSize; row++) {
    for (let col = 0; col < mapSize; col++) {
      const sectionIndex = row * mapSize + col;
      sections.push({
        sectionIndex,
        label: SLIME_QUADRANT_LABELS[sectionIndex] ?? `조각 ${sectionIndex + 1}`,
        solution: extractPiece(SLIME_MASTER_10, row, col, pieceSize),
        pieceColor: SLIME_QUADRANT_COLORS[sectionIndex] ?? 0x4a9a6a,
      });
    }
  }

  return sections;
}

export const SLIME_10X10_SET: PuzzleSet = {
  id: 'slime_10x10',
  pictureSize: 10,
  puzzleSize: 5,
  mapSize: 2,
  sections: buildSlimeSections(),
};
