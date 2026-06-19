export interface DifficultyOption {
  id: string;
  label: string;
  mapSize: number;
  puzzleLabel: string;
  description: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'tutorial',
    label: '튜토리얼',
    mapSize: 1,
    puzzleLabel: '3×3',
    description: '1×1 구역 · 한 칸 퍼즐로 규칙 익히기',
  },
  {
    id: 'normal',
    label: '일반',
    mapSize: 2,
    puzzleLabel: '3×3',
    description: '2×2 구역 · 짧은 런',
  },
  {
    id: 'hard',
    label: '도전',
    mapSize: 3,
    puzzleLabel: '3×3',
    description: '3×3 구역 · 기본 런',
  },
];
