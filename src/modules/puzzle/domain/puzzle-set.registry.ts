import { DRAGON_3X3_SET } from '@modules/puzzle/domain/puzzle-sets/dragon-3x3.data';
import type { PuzzleSet } from '@modules/puzzle/domain/puzzle-sets/puzzle-set.types';
import { SLIME_50X50_SET } from '@modules/puzzle/domain/puzzle-sets/slime-50x50.data';
import type { SectionPuzzleData } from '@modules/puzzle/domain/puzzle.types';

const SETS: PuzzleSet[] = [DRAGON_3X3_SET, SLIME_50X50_SET];
const byId = new Map(SETS.map((s) => [s.id, s]));

export const DEFAULT_PUZZLE_SET_ID = 'dragon_3x3';

export function getPuzzleSet(id?: string): PuzzleSet {
  return byId.get(id ?? DEFAULT_PUZZLE_SET_ID) ?? DRAGON_3X3_SET;
}

export function listPuzzleSets(): PuzzleSet[] {
  return SETS;
}

export function getSectionPuzzle(sectionIndex: number, puzzleSetId?: string): SectionPuzzleData {
  const set = getPuzzleSet(puzzleSetId);
  const idx = sectionIndex % set.sections.length;
  const base = set.sections[idx];
  return {
    ...base,
    sectionIndex,
    label: base.label ?? `구역 ${sectionIndex + 1}`,
  };
}

/** @deprecated getPuzzleSet('dragon_3x3').sections */
export { DRAGON_3X3_SET, SLIME_50X50_SET };
