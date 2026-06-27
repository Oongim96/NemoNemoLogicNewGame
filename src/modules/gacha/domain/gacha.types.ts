import type { CardGrade } from '@modules/card';

import type { CharacterGrade } from '@modules/meta/domain/character-roster.data';



export interface GachaCharacterResult {

  characterId: string;

  name: string;

  grade: CharacterGrade;

  isNew: boolean;

  duplicateGems: number;

  /** 신규 캐릭터 시 함께 지급된 고유 카드 */

  uniqueCardsGranted: { cardId: string; name: string }[];

}



export interface GachaCardResult {

  cardId: string;

  name: string;

  grade: CardGrade;

  isNew: boolean;

  duplicateGold: number;

  duplicateGems: number;

}



/** 1회 = 캐릭터 또는 카드 중 하나만 */

export type GachaPullResult =

  | { kind: 'character'; character: GachaCharacterResult }

  | { kind: 'card'; card: GachaCardResult };



export const GACHA_COST_SINGLE = 100;

export const GACHA_COST_TEN = 900;



/** 캐릭터 당첨 확률 (나머지는 카드) */

export const GACHA_CHARACTER_HIT_RATE = 0.1;

/** 캐릭터 당첨 시 SSR 비율 */

export const GACHA_CHARACTER_SSR_RATE = 0.12;



export const GACHA_CARD_GRADE_RATES: { grade: CardGrade; weight: number }[] = [

  { grade: 'common', weight: 0.65 },

  { grade: 'rare', weight: 0.28 },

  { grade: 'epic', weight: 0.07 },

];



export const DUPLICATE_CHAR_GEMS: Record<CharacterGrade, number> = {

  SR: 60,

  SSR: 180,

};



export const DUPLICATE_CARD_GOLD: Record<CardGrade, number> = {

  common: 20,

  rare: 50,

  epic: 80,

};



export const DUPLICATE_CARD_GEMS: Record<CardGrade, number> = {

  common: 0,

  rare: 5,

  epic: 15,

};



export const CARD_GRADE_LABEL: Record<CardGrade, string> = {

  common: '일반',

  rare: '희귀',

  epic: '에픽',

};



/** 카드 당첨 확률 (캐릭터와 배타) */

export function gachaCardHitRate(): number {

  return 1 - GACHA_CHARACTER_HIT_RATE;

}


