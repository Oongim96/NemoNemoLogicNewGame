/** 카드 장수당 수치 강화 — 1장=base, 2장=base+1, 3장=base+2 … */
export function stackAdd(base: number, stackCount: number): number {
  return base + Math.max(0, stackCount - 1);
}

/** 카드 장수당 배율 강화 — 1장=base, 2장=base×2 … */
export function stackMult(base: number, stackCount: number): number {
  return base * Math.max(1, stackCount);
}

export function stackLabel(cardName: string, stackCount: number): string {
  return stackCount > 1 ? `${cardName} ×${stackCount}` : cardName;
}
