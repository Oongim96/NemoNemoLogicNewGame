export type CardGrade = 'common' | 'rare' | 'epic';
export type BattleType = 'attack' | 'buff' | 'shield' | 'stack' | 'special';
export type Concept =
  | '잉크'
  | '불꽃'
  | '달빛'
  | '철벽'
  | '행운'
  | '힌트'
  | '격자'
  | '저주';

export interface InkCard {
  cardId: string;
  name: string;
  conceptPrimary: Concept;
  conceptSecondary?: Concept;
  grade: CardGrade;
  battleType: BattleType;
  battleCooldown: number;
  battleValue?: number;
  battleValueMax?: number;
  battleEffectKey: string;
  battleEffectParam?: string;
  puzzleTrigger: string;
  puzzleEffectKey: string;
  puzzleEffectParam?: string;
  description: string;
  draftWeight: number;
  maxPerDeck: number;
  enabled: boolean;
}

export interface ConceptThreshold {
  concept: Concept;
  thresholdType: string;
  thresholdCount?: number;
  effectKey: string;
  effectDesc: string;
}
