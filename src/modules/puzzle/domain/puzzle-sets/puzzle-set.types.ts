import type { SectionPuzzleData } from '@modules/puzzle/domain/puzzle.types';

export interface PuzzleSet {
  id: string;
  pictureSize: number;
  puzzleSize: number;
  mapSize: number;
  sections: SectionPuzzleData[];
}
