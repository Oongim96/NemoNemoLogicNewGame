import type { TurnAccumulator } from '@modules/effects/domain/effect.types';

export interface VarianceRollContext {
  floor: number;
  ceilingPct: number;
  turn: TurnAccumulator;
}

/** min~max 사이 정수. floor·천장 보정·턴 임계(재굴림·중간값) 반영 */
export function rollVarianceInt(min: number, max: number, ctx: VarianceRollContext): number {
  if (max < min) [min, max] = [max, min];

  let effectiveMin = Math.min(max, min + ctx.floor + ctx.turn.varianceFloorBonus);
  const ceilingBoost = Math.floor((max - effectiveMin) * (ctx.ceilingPct / 100));
  let effectiveMax = Math.min(max + ceilingBoost, max + Math.floor(max * (ctx.ceilingPct / 100)));

  if (ctx.turn.midpointFloor) {
    effectiveMin = Math.max(effectiveMin, Math.floor((min + max) / 2));
  }

  const span = Math.max(0, effectiveMax - effectiveMin);
  let roll = effectiveMin + (span === 0 ? 0 : Math.floor(Math.random() * (span + 1)));

  if (ctx.turn.rerollLowRolls > 0 && roll < Math.floor((min + max) / 2)) {
    ctx.turn.rerollLowRolls--;
    const retry = effectiveMin + (span === 0 ? 0 : Math.floor(Math.random() * (span + 1)));
    roll = Math.max(roll, retry);
  }

  return roll;
}
