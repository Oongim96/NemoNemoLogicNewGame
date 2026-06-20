import { computePictureSize } from '@modules/meta/domain/picture-size.util';

/** 큰 그림(런) — 난이도·맵 크기는 스테이지마다 고정 */
export interface PictureStage {
  id: string;
  title: string;
  subtitle: string;
  /** 맵 그리드 한 변 (구역 개수 = mapSize²) */
  mapSize: number;
  /** `puzzle-set.registry` 키 */
  puzzleSetId: string;
  /** 구역당 퍼즐 한 변 */
  puzzleSize: number;
  icon: string;
  bgColor: number;
}

export function getStagePictureSize(stage: PictureStage): number {
  return computePictureSize(stage.mapSize, stage.puzzleSize);
}

export const PICTURE_STAGES: PictureStage[] = [
  {
    id: 'demo_ink_slime',
    title: '잉크 슬라임 (예시)',
    subtitle: '5×5 맵 · 구역당 10×10 · 완성 50×50',
    mapSize: 5,
    puzzleSetId: 'slime_50x50',
    puzzleSize: 10,
    icon: '🖌',
    bgColor: 0x2a4a3a,
  },
  {
    id: 'tutorial_slime',
    title: '슬라임 숲',
    subtitle: '튜토리얼 · 10×10 한 조각',
    mapSize: 1,
    puzzleSetId: 'slime_50x50',
    puzzleSize: 10,
    icon: '🟢',
    bgColor: 0x2a4a2a,
  },
  {
    id: 'dragon_ancient',
    title: '고대 용의 그림',
    subtitle: '2×2 맵 · 구역당 3×3 · 완성 6×6',
    mapSize: 2,
    puzzleSetId: 'dragon_3x3',
    puzzleSize: 3,
    icon: '🐉',
    bgColor: 0x2a2a4a,
  },
  {
    id: 'dragon_legend',
    title: '용의 전설',
    subtitle: '3×3 맵 · 구역당 3×3 · 완성 9×9',
    mapSize: 3,
    puzzleSetId: 'dragon_3x3',
    puzzleSize: 3,
    icon: '🐲',
    bgColor: 0x4a2a2a,
  },
];

export function getPictureStage(id: string): PictureStage | undefined {
  return PICTURE_STAGES.find((s) => s.id === id);
}
