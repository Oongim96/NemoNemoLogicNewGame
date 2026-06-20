import type { SectionPuzzleData } from '@modules/puzzle/domain/puzzle.types';

export interface PuzzleSet {
  id: string;
  /** mapSize × puzzleSize (sync 시 자동 계산) */
  pictureSize: number;
  puzzleSize: number;
  mapSize: number;
  /** 완성 그림 미리보기용 (선택) */
  masterGrid?: number[][];
  sections: SectionPuzzleData[];
}
