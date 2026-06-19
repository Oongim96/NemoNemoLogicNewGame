import type { SectionRewardCategory, SectionRewardType } from '@modules/reward/domain/reward.types';

/** 맵 배정 가중치 — 드래프트 / 상점 / 이벤트(나머지 통합) */
export const SECTION_CATEGORY_WEIGHTS: { category: SectionRewardCategory; weight: number }[] = [
  { category: 'draft', weight: 72 },
  { category: 'shop', weight: 10 },
  { category: 'event', weight: 18 },
];

/** 이벤트 구역 클리어 시 세부 롤 (골드·회복·함정·이벤트) */
export const EVENT_BUCKET_WEIGHTS: { type: Exclude<SectionRewardType, 'draft' | 'shop'>; weight: number }[] = [
  { type: 'gold', weight: 6 },
  { type: 'event', weight: 5 },
  { type: 'heal', weight: 4 },
  { type: 'trap', weight: 3 },
];

export const DRAFT_BONUS_GOLD = { min: 10, max: 18 } as const;

export const REWARD_LABELS: Record<SectionRewardType, string> = {
  draft: '능력 3택1',
  gold: '골드',
  shop: '상점',
  event: '이벤트',
  heal: '회복',
  trap: '함정',
};

/** 맵 타일 중앙 — 3종만 표시 */
export const REWARD_CATEGORY_DISPLAY: Record<
  SectionRewardCategory,
  { icon: string; shortLabel: string; color: string }
> = {
  draft: { icon: '🃏', shortLabel: '3택1', color: '#9b7fff' },
  shop: { icon: '🏪', shortLabel: '상점', color: '#3dd68c' },
  event: { icon: '✨', shortLabel: '이벤트', color: '#ffb347' },
};
