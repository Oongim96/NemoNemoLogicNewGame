export type SectionStatus = 'locked' | 'available' | 'completed';

export interface RunProgress {
  mapSize: number;
  completedSections: number[];
  gold: number;
  mistakes: number;
}
