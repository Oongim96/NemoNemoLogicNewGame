import { cardRepository } from '@modules/card';
import type { Concept } from '@modules/card';
import type { InkDeck } from '@modules/deck';
import type { DeckCardInstance } from '@modules/effects/battle/battle-state.entity';

export interface ActiveThreshold {
  concept: Concept;
  thresholdType: 'deck' | 'turn';
  effectKey: string;
  effectDesc: string;
}

export function getDeckThresholds(deck: InkDeck, concept: Concept): ActiveThreshold[] {
  const count = deck.countByConcept(concept);
  return cardRepository
    .getConceptThresholds(concept)
    .filter((t) => t.thresholdType === 'deck' && count >= (t.thresholdCount ?? 0))
    .map((t) => ({
      concept: t.concept as Concept,
      thresholdType: 'deck',
      effectKey: t.effectKey,
      effectDesc: t.effectDesc,
    }));
}

export function getTurnThresholds(
  concept: Concept,
  turnConceptCardCount: number,
): ActiveThreshold[] {
  return cardRepository
    .getConceptThresholds(concept)
    .filter((t) => t.thresholdType === 'turn' && turnConceptCardCount >= (t.thresholdCount ?? 0))
    .map((t) => ({
      concept: t.concept as Concept,
      thresholdType: 'turn',
      effectKey: t.effectKey,
      effectDesc: t.effectDesc,
    }));
}

export function countConceptInTurn(instances: DeckCardInstance[], concept: Concept): number {
  return instances.filter(
    (i) => i.card.conceptPrimary === concept || i.card.conceptSecondary === concept,
  ).length;
}

export function applyDeckThresholdModifiers(
  deck: InkDeck,
  concept: Concept,
): { inkMaxBonus: number; inkCardCooldownReduce: number } {
  const active = getDeckThresholds(deck, concept);
  let inkMaxBonus = 0;
  let inkCardCooldownReduce = 0;

  for (const t of active) {
    if (t.effectKey === 'ink_max_stack_plus') inkMaxBonus += 2;
    if (t.effectKey === 'ink_line_bonus') inkCardCooldownReduce += 1;
  }

  return { inkMaxBonus, inkCardCooldownReduce };
}

export function applyTurnThresholdToAccumulator(
  concept: Concept,
  turnCount: number,
  acc: {
    splashPct: number;
    forceExplosion: boolean;
    aoeMult: number;
    varianceFloorBonus: number;
    rerollLowRolls: number;
    midpointFloor: boolean;
    messages: string[];
  },
  thresholds: ActiveThreshold[],
): void {
  for (const t of thresholds) {
    if (concept === '잉크') {
      if (t.effectKey === 'ink_splash' && turnCount >= 3) {
        acc.splashPct = Math.max(acc.splashPct, 60);
        acc.messages.push('잉크 턴3+: 60% 스플래시');
      }
      if (t.effectKey === 'ink_explosion' && turnCount >= 5) {
        acc.forceExplosion = true;
        acc.aoeMult = Math.max(acc.aoeMult, 100);
        acc.messages.push('잉크 턴5+: 스택 폭발');
      }
    }
    if (concept === '변동') {
      if (t.effectKey === 'variance_floor_turn' && turnCount >= 3) {
        acc.varianceFloorBonus += 5;
        acc.messages.push('변동 턴3+: 랜덤 최소 +5');
      }
      if (t.effectKey === 'reroll_bottom' && turnCount >= 3) {
        acc.rerollLowRolls += 1;
        acc.messages.push('변동 턴3+: 낮은 랜덤 1회 재굴림');
      }
      if (t.effectKey === 'midpoint_floor' && turnCount >= 4) {
        acc.midpointFloor = true;
        acc.messages.push('변동 턴4+: 이번 턴 랜덤 최소=중간값');
      }
    }
  }
}
