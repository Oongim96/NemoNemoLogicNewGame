export type { SectionPuzzleData } from '@modules/puzzle/domain/puzzle.types';
export type { CellState } from '@modules/puzzle/domain/nonogram.logic';
export {
  computeLineClues,
  createEmptyGrid,
  getColClues,
  getRowClues,
  isCellCorrect,
  isSolutionComplete,
} from '@modules/puzzle/domain/nonogram.logic';
export {
  getSectionPuzzle,
  MAP_SIZE,
  PUZZLE_SIZE,
  SECTION_COUNT,
  SECTION_PUZZLES,
} from '@modules/puzzle/domain/section-puzzles.data';