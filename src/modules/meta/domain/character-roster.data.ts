import type { Concept } from '@modules/card';
import type { PartyMember } from '@modules/party';

export type CharacterGrade = 'SR' | 'SSR';

export interface CharacterDef {
  id: string;
  name: string;
  grade: CharacterGrade;
  primaryConcept: Concept;
  secondaryConcept?: Concept;
  uniqueCardIds: string[];
  tagline: string;
}

export const CHARACTER_ROSTER: CharacterDef[] = [
  {
    id: 'char_luna',
    name: '루나',
    grade: 'SR',
    primaryConcept: '달빛',
    secondaryConcept: '힌트',
    uniqueCardIds: ['moon_004', 'moon_005'],
    tagline: '정밀·힌트',
  },
  {
    id: 'char_brix',
    name: '브릭스',
    grade: 'SR',
    primaryConcept: '철벽',
    uniqueCardIds: ['wall_004'],
    tagline: '탱·실수 완화',
  },
  {
    id: 'char_mio',
    name: '미오',
    grade: 'SR',
    primaryConcept: '행운',
    uniqueCardIds: ['luck_005'],
    tagline: '드래프트·보물',
  },
  {
    id: 'char_sera',
    name: '세라핀',
    grade: 'SR',
    primaryConcept: '잉크',
    uniqueCardIds: ['ink_006'],
    tagline: '잉크·회복',
  },
  {
    id: 'char_vega',
    name: '베가',
    grade: 'SSR',
    primaryConcept: '잉크',
    uniqueCardIds: ['ink_007'],
    tagline: '빠른 채색',
  },
  {
    id: 'char_ignis',
    name: '이그니스',
    grade: 'SSR',
    primaryConcept: '불꽃',
    uniqueCardIds: ['flame_006'],
    tagline: '콤보 폭발',
  },
  {
    id: 'char_diana',
    name: '디아나',
    grade: 'SSR',
    primaryConcept: '달빛',
    uniqueCardIds: ['moon_006'],
    tagline: '약점 줄 독해',
  },
  {
    id: 'char_magnar',
    name: '마그너',
    grade: 'SSR',
    primaryConcept: '철벽',
    uniqueCardIds: ['wall_005'],
    tagline: '실수 무시 밀기',
  },
  {
    id: 'char_fortune',
    name: '포춘',
    grade: 'SSR',
    primaryConcept: '행운',
    uniqueCardIds: ['luck_006'],
    tagline: '4택1 지배',
  },
  {
    id: 'char_oracle',
    name: '오라클',
    grade: 'SSR',
    primaryConcept: '힌트',
    uniqueCardIds: ['hint_005'],
    tagline: '숫자 자동 해석',
  },
  {
    id: 'char_grid',
    name: '그리드',
    grade: 'SSR',
    primaryConcept: '격자',
    uniqueCardIds: ['grid_004'],
    tagline: '줄 완성 연쇄',
  },
  {
    id: 'char_moirai',
    name: '모이라',
    grade: 'SSR',
    primaryConcept: '저주',
    uniqueCardIds: ['curse_004'],
    tagline: '함정을 파워로',
  },
];

const rosterById = new Map(CHARACTER_ROSTER.map((c) => [c.id, c]));

export function getCharacterDef(id: string): CharacterDef | undefined {
  return rosterById.get(id);
}

export function characterToPartyMember(def: CharacterDef): PartyMember {
  return {
    id: def.id,
    name: def.name,
    primaryConcept: def.primaryConcept,
    secondaryConcept: def.secondaryConcept,
    uniqueCardIds: def.uniqueCardIds,
  };
}
