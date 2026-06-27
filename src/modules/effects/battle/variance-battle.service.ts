import type { InkCard } from '@modules/card';
import type { InkDeck } from '@modules/deck';
import { parseEffectParams, paramNumber } from '@modules/effects/domain/effect-params';

export interface VarianceBattleMods {
  floor: number;
  ceilingPct: number;
}

function stackedCount(deck: InkDeck, cardId: string): number {
  return deck.countById(cardId);
}

function floorFromCard(card: InkCard, deck: InkDeck): number {
  const stack = stackedCount(deck, card.cardId);
  const params = parseEffectParams(card.puzzleEffectParam ?? card.battleEffectParam);
  if (card.battleEffectKey === 'variance_floor_boost' || card.puzzleEffectKey === 'variance_floor_puzzle') {
    return paramNumber(params, 'floor', 2) * stack;
  }
  if (card.battleEffectKey === 'variance_floor_anchor') {
    const per = paramNumber(params, 'per_card', 3);
    return per * stack;
  }
  return 0;
}

/** 덱·패시브 카드에서 전투 랜덤 최솟값·천장 보정 수집 */
export function collectVarianceBattleMods(deck: InkDeck): VarianceBattleMods {
  let floor = 0;
  let ceilingPct = 0;
  const seen = new Set<string>();

  for (const card of deck.getAll()) {
    if (seen.has(card.cardId)) continue;
    seen.add(card.cardId);
    floor += floorFromCard(card, deck);
  }

  const varCount = deck.countByConcept('변동');
  if (varCount >= 5) floor += 10;
  else if (varCount >= 3) floor += 5;

  if (varCount >= 5) ceilingPct += 15;

  return { floor, ceilingPct };
}

export function collectVariancePuzzleFloor(deck: InkDeck): number {
  let floor = 0;
  const seen = new Set<string>();
  for (const card of deck.getAll()) {
    if (seen.has(card.cardId)) continue;
    seen.add(card.cardId);
    if (card.puzzleEffectKey !== 'variance_floor_puzzle') continue;
    const params = parseEffectParams(card.puzzleEffectParam);
    floor += paramNumber(params, 'floor', 2) * stackedCount(deck, card.cardId);
  }
  return floor;
}
