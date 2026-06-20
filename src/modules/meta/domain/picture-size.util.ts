/** 완성 그림 한 변 = 맵 구역 수 × 구역당 퍼즐 크기 */
export function computePictureSize(mapSize: number, puzzleSize: number): number {
  return mapSize * puzzleSize;
}
