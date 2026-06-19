import type { PartyConfig } from '@modules/party/domain/party.types';

/** 기본 SR 파티 (기획 06c) */
export const DEFAULT_PARTY: PartyConfig = {
  members: [
    {
      id: 'luna',
      name: '루나',
      primaryConcept: '달빛',
      secondaryConcept: '힌트',
      uniqueCardIds: ['moon_004', 'moon_005'],
    },
    {
      id: 'bricks',
      name: '브릭스',
      primaryConcept: '철벽',
      uniqueCardIds: ['wall_004'],
    },
    {
      id: 'mio',
      name: '미오',
      primaryConcept: '행운',
      uniqueCardIds: ['luck_005'],
    },
    {
      id: 'serafin',
      name: '세라핀',
      primaryConcept: '잉크',
      uniqueCardIds: ['ink_006'],
    },
  ],
};
