/** 맵에 표시하는 3종 (드래프트·상점·이벤트) */
export type SectionRewardCategory = 'draft' | 'shop' | 'event';

/** 클리어 시 실제 지급 타입 */
export type SectionRewardType =
  | 'draft'
  | 'gold'
  | 'shop'
  | 'event'
  | 'heal'
  | 'trap';

export interface SectionReward {
  type: SectionRewardType;
  goldAmount?: number;
}

export interface SectionAssignment {
  category: SectionRewardCategory;
  /** draft 구역만 런 시작 시 확정 */
  draftReward?: SectionReward;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
}
