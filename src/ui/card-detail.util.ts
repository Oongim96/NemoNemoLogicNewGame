import type { ConceptThreshold, InkCard } from '@modules/card/domain/card.types';
import { cardRepository } from '@modules/card/infrastructure/card.repository';
import { BATTLE_TYPE_KO } from '@modules/card';

export interface CardEffectSplit {
  puzzle: string;
  battle: string;
}

const BATTLE_MARKER = '. 전투:';
const PUZZLE_MARKER = '. 퍼즐:';

/** description → 퍼즐 / 전투 구역 */
export function splitCardEffectDescription(description: string): CardEffectSplit {
  const puzzleIdx = description.lastIndexOf(PUZZLE_MARKER);
  if (puzzleIdx >= 0) {
    return {
      battle: description.slice(0, puzzleIdx).trim(),
      puzzle: description.slice(puzzleIdx + PUZZLE_MARKER.length).trim(),
    };
  }

  const battleIdx = description.lastIndexOf(BATTLE_MARKER);
  if (battleIdx >= 0) {
    return {
      puzzle: description.slice(0, battleIdx).trim(),
      battle: description.slice(battleIdx + BATTLE_MARKER.length).trim(),
    };
  }

  return { puzzle: description.trim(), battle: '' };
}

export function buildCardDetailSections(card: InkCard): { title: string; body: string }[] {
  const { puzzle, battle } = splitCardEffectDescription(card.description);
  const sections: { title: string; body: string }[] = [];

  sections.push({
    title: '퍼즐',
    body: puzzle || '—',
  });

  sections.push({
    title: '전투',
    body: formatBattleSection(card, battle),
  });

  for (const setSection of buildConceptSetSections(card)) {
    sections.push(setSection);
  }

  return sections;
}

function formatBattleSection(card: InkCard, battleText: string): string {
  const type = BATTLE_TYPE_KO[card.battleType] ?? card.battleType;
  const lines = [`쿨다운 ${card.battleCooldown}턴 · ${type}`];

  if (battleText && battleText !== '없음') {
    lines.push(battleText);
  } else if (card.battleValue != null) {
    const val =
      card.battleValueMax != null
        ? `${card.battleValue}~${card.battleValueMax}`
        : `${card.battleValue}`;
    lines.push(`위력 ${val}`);
  } else if (battleText === '없음') {
    lines.push('없음');
  }

  return lines.join('\n');
}

function buildConceptSetSections(card: InkCard): { title: string; body: string }[] {
  const concepts = [card.conceptPrimary];
  if (card.conceptSecondary && card.conceptSecondary !== card.conceptPrimary) {
    concepts.push(card.conceptSecondary);
  }

  return concepts.map((concept) => {
    const thresholds = cardRepository.getConceptThresholds(concept);
    const lines = thresholds.map((t) => `· ${formatThresholdCondition(t)} — ${t.effectDesc}`);
    return {
      title: `${concept} 세트`,
      body: lines.length > 0 ? lines.join('\n') : '등록된 세트 효과 없음',
    };
  });
}

function formatThresholdCondition(t: ConceptThreshold): string {
  const n = t.thresholdCount;
  switch (t.thresholdType) {
    case 'deck':
      return `덱 ${n}장+`;
    case 'turn':
      return `턴 ${n}장+`;
    case 'turn_shield':
      return `턴 실드 ${n}+`;
    case 'stack':
      return `스택 ${n}+`;
    case 'deck5_turn2':
      return '덱 5장+ · 턴 2장+';
    case 'deck4_hp50':
      return '덱 4장+ · HP 50% 이하';
    default:
      return `${t.thresholdType}${n != null ? ` ${n}` : ''}`;
  }
}
