export interface SectionPuzzleData {
  sectionIndex: number;
  label: string;
  solution: number[][];
  /** 큰 그림 조각 색 (완료 시 맵 타일에 사용) */
  pieceColor: number;
}
