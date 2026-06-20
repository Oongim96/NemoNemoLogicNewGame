/** 배치 그리드 열 수 (좌→우, 위→아래 발동 순) */
export const BATTLE_FORMATION_COLS = 4;

export function defaultFormationOrder(deckSize: number): number[] {
  return Array.from({ length: deckSize }, (_, i) => i);
}

export function swapFormationSlots(order: number[], a: number, b: number): number[] {
  if (a === b || a < 0 || b < 0 || a >= order.length || b >= order.length) return order;
  const next = [...order];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return next;
}

export function isValidFormationOrder(order: number[], deckSize: number): boolean {
  if (order.length !== deckSize) return false;
  const seen = new Set<number>();
  for (const i of order) {
    if (i < 0 || i >= deckSize || seen.has(i)) return false;
    seen.add(i);
  }
  return true;
}
