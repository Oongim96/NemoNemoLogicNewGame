import type { BattleType, InkCard } from '@modules/card/domain/card.types';
import { CHARACTER_ROSTER } from '@modules/meta/domain/character-roster.data';

const START_CARD_PREFIX = 'start_';

const UNIQUE_CARD_IDS = new Set(CHARACTER_ROSTER.flatMap((c) => c.uniqueCardIds));

/** 전투 턴 합산 타입 — 덱에서 하는 역할 */
export const BATTLE_TYPE_KO: Record<BattleType, string> = {
  attack: '공격',
  buff: '버프',
  shield: '실드',
  stack: '스택',
  special: '특수',
};

/** 퍼즐 발동 타이밍 — 빌드 시 퍼즐 페이즈 기여 */
export const PUZZLE_TRIGGER_KO: Record<string, string> = {
  passive: '패시브',
  on_cell_correct: '칸',
  on_line_complete: '줄',
  on_section_complete: '구역',
  on_combo: '콤보',
  on_mistake: '오답',
};

export function isCharacterUniqueCard(cardId: string): boolean {
  return UNIQUE_CARD_IDS.has(cardId);
}

export function isStartDeckCard(cardId: string): boolean {
  return cardId.startsWith(START_CARD_PREFIX);
}

/** 도감·드래프트용 전략 태그 (등급·컨셉·쿨 제외 — 쿨은 상세 전투 구역) */
export function buildCardStrategyTags(card: InkCard, max = 4): string[] {
  const tags: string[] = [];

  if (isCharacterUniqueCard(card.cardId)) {
    tags.push('고유');
  } else if (isStartDeckCard(card.cardId)) {
    tags.push('시작');
  }

  tags.push(BATTLE_TYPE_KO[card.battleType] ?? card.battleType);

  const puzzleTag = PUZZLE_TRIGGER_KO[card.puzzleTrigger];
  if (puzzleTag) tags.push(puzzleTag);

  if (
    card.conceptSecondary &&
    card.conceptSecondary !== card.conceptPrimary &&
    tags.length < max
  ) {
    tags.push('교차');
  }

  return tags.slice(0, max);
}
