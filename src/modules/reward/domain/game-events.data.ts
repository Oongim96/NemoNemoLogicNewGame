import type { GameEvent } from '@modules/reward/domain/reward.types';

export const GAME_EVENTS: GameEvent[] = [
  {
    id: 'ink_windfall',
    title: '길 잃은 잉크',
    description: '바닥에서 잉크 방울을 주웠다. 골드 +15',
  },
  {
    id: 'mystery_trade',
    title: '신비한 거래',
    description: '낯선 상인이 카드 한 장을 건넸다.',
  },
  {
    id: 'whisper_curse',
    title: '저주의 속삭임',
    description: '어둠이 스쳐 지나간다.\n퍼즐을 틀린 것과 같이 HP가 1 줄어든다.',
  },
];
