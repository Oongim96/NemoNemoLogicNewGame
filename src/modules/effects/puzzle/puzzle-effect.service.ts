import type { InkCard } from '@modules/card';
import type { InkDeck } from '@modules/deck';
import type { PartyConfig } from '@modules/party';
import type { CellState } from '@modules/puzzle';
import { parseEffectParams } from '@modules/effects/domain/effect-params';
import type { PuzzleRunModifiers, PuzzleTrigger } from '@modules/effects/domain/effect.types';
import { emptyPuzzleResult, mergePuzzleResults } from '@modules/effects/domain/effect.types';
import {
  applyPuzzleEffectKey,
  puzzleEffectModifiesInkMax,
  puzzleEffectModifiesMistakeReduce,
} from '@modules/effects/puzzle/puzzle-effect.registry';
import type { PuzzleSession } from '@modules/effects/puzzle/puzzle-session.entity';
import {
  applyCharacterPuzzlePassive,
  applyCharacterSectionPassive,
  applyCharacterUlt,
  getCharacterPassives,
} from '@modules/effects/character/character-passive.service';

export function collectPassiveModifiers(deck: InkDeck): PuzzleRunModifiers {
  const mods: PuzzleRunModifiers = { mistakeHpReduce: 0, inkMaxStackBonus: 0 };
  const inkCount = deck.countByConcept('잉크');

  for (const card of deck.getAll()) {
    if (card.puzzleTrigger !== 'passive') continue;
    const params = parseEffectParams(card.puzzleEffectParam);
    mods.mistakeHpReduce += puzzleEffectModifiesMistakeReduce(card.puzzleEffectKey, params);
    mods.inkMaxStackBonus += puzzleEffectModifiesInkMax(card.puzzleEffectKey, params, inkCount);
  }

  return mods;
}

function cardsForTrigger(deck: InkDeck, trigger: PuzzleTrigger): InkCard[] {
  return deck.getAll().filter((c) => c.puzzleTrigger === trigger);
}

export interface FirePuzzleEffectsInput {
  deck: InkDeck;
  party: PartyConfig;
  trigger: PuzzleTrigger;
  solution: number[][];
  grid: CellState[][];
  modifiers: PuzzleRunModifiers;
  cell?: { x: number; y: number };
  line?: { axis: 'row' | 'col'; index: number };
  session?: PuzzleSession;
}

export function firePuzzleEffects(input: FirePuzzleEffectsInput) {
  const { deck, party, trigger, solution, grid, modifiers, cell, line, session } = input;
  const inkCount = deck.countByConcept('잉크');
  const cards = cardsForTrigger(deck, trigger);
  let result = emptyPuzzleResult();

  for (const card of cards) {
    const params = parseEffectParams(card.puzzleEffectParam);
    const ctx = { card, params, solution, grid, cell, line, modifiers, deckInkCount: inkCount };
    result = mergePuzzleResults(result, applyPuzzleEffectKey(card.puzzleEffectKey, ctx));
  }

  if (trigger === 'on_cell_correct' || trigger === 'on_line_complete') {
    const charId = party.members[0]?.id;
    if (charId) {
      const passive = getCharacterPassives(charId);
      if (passive?.puzzlePassiveKey) {
        result = mergePuzzleResults(
          result,
          applyCharacterPuzzlePassive(passive, { trigger, session, deckInkCount: inkCount }),
        );
      }
    }
  }

  if (trigger === 'on_section_complete' && session) {
    const charId = party.members[0]?.id;
    if (charId) {
      const passive = getCharacterPassives(charId);
      if (passive) {
        result = mergePuzzleResults(result, applyCharacterSectionPassive(passive, session));
      }
    }
  }

  return result;
}

export function tryCharacterUlt(
  characterId: string,
  ultType: 'reset_mistakes',
  sectionUsesLeft: number,
): { used: boolean; message: string } {
  const passive = getCharacterPassives(characterId);
  if (!passive?.ultKey || passive.ultKey !== ultType || sectionUsesLeft <= 0) {
    return { used: false, message: '' };
  }
  return applyCharacterUlt(passive);
}

export function getConceptStarterCards(concept: string): string[] {
  const starters: Record<string, string[]> = {
    잉크: ['ink_001', 'ink_002'],
    불꽃: ['flame_001', 'flame_002'],
    달빛: ['moon_001', 'moon_002'],
    철벽: ['wall_001', 'wall_003'],
    행운: ['luck_001', 'luck_002'],
    힌트: ['hint_001', 'hint_002'],
    격자: ['grid_001', 'grid_002'],
    저주: ['curse_001', 'curse_002'],
  };
  return starters[concept] ?? [];
}
