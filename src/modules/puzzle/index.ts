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
  getPuzzleSet,
  listPuzzleSets,
  DEFAULT_PUZZLE_SET_ID,
  DRAGON_3X3_SET,
  SLIME_10X10_SET,
} from '@modules/puzzle/domain/puzzle-set.registry';
export type { PuzzleSet } from '@modules/puzzle/domain/puzzle-sets/puzzle-set.types';
export {
  MAP_SIZE,
  PUZZLE_SIZE,
  SECTION_COUNT,
  SECTION_PUZZLES,
} from '@modules/puzzle/domain/puzzle-sets/dragon-3x3.data';