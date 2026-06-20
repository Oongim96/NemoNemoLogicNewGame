/** 큰 그림(런) — 난이도·맵 크기는 스테이지마다 고정 */
export interface PictureStage {
  id: string;
  title: string;
  subtitle: string;
  mapSize: number;
  /** `puzzle-set.registry` 키 */
  puzzleSetId: string;
  /** 구역당 퍼즐 한 변 (UI 표시용) */
  puzzleSize: number;
  /** 완성 그림 한 변 */
  pictureSize: number;
  icon: string;
  bgColor: number;
}

export const PICTURE_STAGES: PictureStage[] = [
  {
    id: 'tutorial_slime',
    title: '슬라임 숲',
    subtitle: '튜토리얼',
    mapSize: 1,
    puzzleSetId: 'dragon_3x3',
    puzzleSize: 3,
    pictureSize: 9,
    icon: '🟢',
    bgColor: 0x2a4a2a,
  },
  {
    id: 'demo_ink_slime',
    title: '잉크 슬라임 (예시)',
    subtitle: '잉크 · 예시',
    mapSize: 2,
    puzzleSetId: 'slime_10x10',
    puzzleSize: 5,
    pictureSize: 10,
    icon: '🖌',
    bgColor: 0x2a4a3a,
  },
  {
    id: 'dragon_ancient',
    title: '고대 용의 그림',
    subtitle: '일반',
    mapSize: 2,
    puzzleSetId: 'dragon_3x3',
    puzzleSize: 3,
    pictureSize: 9,
    icon: '🐉',
    bgColor: 0x2a2a4a,
  },
  {
    id: 'dragon_legend',
    title: '용의 전설',
    subtitle: '도전',
    mapSize: 3,
    puzzleSetId: 'dragon_3x3',
    puzzleSize: 3,
    pictureSize: 9,
    icon: '🐲',
    bgColor: 0x4a2a2a,
  },
];

export function getPictureStage(id: string): PictureStage | undefined {
  return PICTURE_STAGES.find((s) => s.id === id);
}
