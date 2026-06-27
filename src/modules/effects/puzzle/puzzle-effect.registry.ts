import type { InkCard } from '@modules/card';
import type { CellState } from '@modules/puzzle';
import { paramNumber } from '@modules/effects/domain/effect-params';
import type { PuzzleEffectResult, PuzzleRunModifiers } from '@modules/effects/domain/effect.types';
import { emptyPuzzleResult } from '@modules/effects/domain/effect.types';
import { stackAdd, stackLabel, stackMult } from '@modules/effects/puzzle/puzzle-effect-scale';
import {
  pickAdjacentUnresolved,
  pickCrossUnresolved,
  pickRandomUnresolvedCells,
} from '@modules/effects/puzzle/puzzle-session.entity';

export interface PuzzleEffectContext {
  card: InkCard;
  /** 덱에 있는 동일 카드 장수 */
  stackCount: number;
  params: Record<string, string>;
  solution: number[][];
  grid: CellState[][];
  cell?: { x: number; y: number };
  line?: { axis: 'row' | 'col'; index: number };
  modifiers: PuzzleRunModifiers;
  deckInkCount: number;
}

type PuzzleHandler = (ctx: PuzzleEffectContext) => PuzzleEffectResult;

function revealCells(
  ctx: PuzzleEffectContext,
  cells: { x: number; y: number }[],
  detail: string,
): PuzzleEffectResult {
  const label = stackLabel(ctx.card.name, ctx.stackCount);
  return {
    ...emptyPuzzleResult(),
    messages: cells.length > 0 ? [`${label}: ${detail} ${cells.length}칸`] : [],
    reveals: cells.map(({ x, y }) => ({ x, y, shouldFill: ctx.solution[y]![x] === 1 })),
  };
}

const REGISTRY: Record<string, PuzzleHandler> = {
  reveal_cross_1(ctx) {
    const range = stackAdd(paramNumber(ctx.params, 'range', 1), ctx.stackCount);
    const cell = ctx.cell;
    if (!cell) return emptyPuzzleResult();
    const cells = pickCrossUnresolved(ctx.solution, ctx.grid, cell.x, cell.y, range);
    return revealCells(ctx, cells, `십자 ${range}`);
  },

  reveal_adjacent_2(ctx) {
    const count = stackAdd(paramNumber(ctx.params, 'count', 2), ctx.stackCount);
    const cell = ctx.cell;
    if (!cell) return emptyPuzzleResult();
    const cells = pickAdjacentUnresolved(ctx.solution, ctx.grid, cell.x, cell.y, count);
    return revealCells(ctx, cells, `인접 ${count}`);
  },

  reveal_random(ctx) {
    const count = stackAdd(paramNumber(ctx.params, 'cells', 3), ctx.stackCount);
    const cells = pickRandomUnresolvedCells(ctx.solution, ctx.grid, count);
    return revealCells(ctx, cells, `랜덤 ${count}`);
  },

  reveal_random_start(ctx) {
    const count = stackAdd(paramNumber(ctx.params, 'cells', 3), ctx.stackCount);
    const cells = pickRandomUnresolvedCells(ctx.solution, ctx.grid, count);
    return revealCells(ctx, cells, `시작 힌트 ${count}`);
  },

  reveal_cell_state(ctx) {
    const cell = ctx.cell;
    if (!cell) return emptyPuzzleResult();
    const cells = pickRandomUnresolvedCells(ctx.solution, ctx.grid, stackAdd(1, ctx.stackCount));
    return revealCells(ctx, cells, '칸 공개');
  },

  mark_candidate(ctx) {
    const count = stackAdd(paramNumber(ctx.params, 'cells', 1), ctx.stackCount);
    const cells = pickRandomUnresolvedCells(ctx.solution, ctx.grid, count);
    return revealCells(ctx, cells, `후보 ${count}`);
  },

  highlight_line(ctx) {
    const sec = stackAdd(paramNumber(ctx.params, 'sec', 1), ctx.stackCount);
    const line = ctx.line;
    if (!line) return emptyPuzzleResult();
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 줄 강조 ${sec}초`],
      highlightLine: { ...line, durationSec: sec },
    };
  },

  mistake_reduce(ctx) {
    const amount = stackMult(paramNumber(ctx.params, 'amount', 1), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 오답 피해 -${amount}`],
      heal: amount,
    };
  },

  ink_max_bonus(ctx) {
    const bonus = stackMult(paramNumber(ctx.params, 'deck3', 2), ctx.stackCount);
    if (ctx.deckInkCount < 3) return emptyPuzzleResult();
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 잉크 상한 +${bonus}`],
    };
  },

  curse_to_atk_stack(ctx) {
    const per = stackMult(paramNumber(ctx.params, 'per_mistake', 1), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 공격 스택 +${per}`],
      attackStackDelta: per,
    };
  },

  curse_stack_add(ctx) {
    const amount = stackMult(paramNumber(ctx.params, 'amount', 1), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 저주 스택 +${amount}`],
      attackStackDelta: amount,
    };
  },

  mistake_hp_loss(ctx) {
    const amount = stackMult(paramNumber(ctx.params, 'amount', 1), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: HP -${amount}`],
      heal: -amount,
    };
  },

  gold_small(ctx) {
    const amount = stackMult(paramNumber(ctx.params, 'amount', 3), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 골드 +${amount}`],
      gold: amount,
    };
  },

  gold_on_line(ctx) {
    const amount = stackMult(paramNumber(ctx.params, 'amount', 3), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 줄 골드 +${amount}`],
      gold: amount,
    };
  },

  ink_on_line(ctx) {
    const delta = stackAdd(1, ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 줄 잉크 +${delta}`],
      inkStackDelta: delta,
    };
  },

  combo_extend(ctx) {
    const grant = stackAdd(paramNumber(ctx.params, 'window', 1), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 콤보 보호 +${grant}`],
      comboShieldGrant: grant,
    };
  },

  mistake_to_shield(ctx) {
    const amount = stackMult(paramNumber(ctx.params, 'amount', 5), ctx.stackCount);
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 실드 +${amount} (전투)`],
      attackStackDelta: 0,
    };
  },

  variance_reveal_roll(ctx) {
    const min = stackAdd(paramNumber(ctx.params, 'min', 1), ctx.stackCount) + ctx.modifiers.varianceRollFloor;
    const max = stackAdd(paramNumber(ctx.params, 'max', 3), ctx.stackCount) + ctx.modifiers.varianceRollFloor;
    const count = min + Math.floor(Math.random() * Math.max(1, max - min + 1));
    const cells = pickRandomUnresolvedCells(ctx.solution, ctx.grid, count);
    return revealCells(ctx, cells, `🎲 힌트 ${min}~${max} → ${count}칸`);
  },

  variance_gold_roll(ctx) {
    const min = stackAdd(paramNumber(ctx.params, 'min', 2), ctx.stackCount) + ctx.modifiers.varianceRollFloor;
    const max = stackAdd(paramNumber(ctx.params, 'max', 6), ctx.stackCount) + ctx.modifiers.varianceRollFloor;
    const gold = min + Math.floor(Math.random() * Math.max(1, max - min + 1));
    const label = stackLabel(ctx.card.name, ctx.stackCount);
    return {
      ...emptyPuzzleResult(),
      messages: [`${label}: 🎲 골드 +${gold}`],
      gold,
    };
  },

  variance_floor_puzzle() {
    return emptyPuzzleResult();
  },
};

export function applyPuzzleEffectKey(key: string, ctx: PuzzleEffectContext): PuzzleEffectResult {
  const handler = REGISTRY[key];
  if (!handler) return emptyPuzzleResult();
  return handler(ctx);
}

export function puzzleEffectModifiesMistakeReduce(
  key: string,
  params: Record<string, string>,
  stackCount = 1,
): number {
  if (key !== 'mistake_reduce') return 0;
  return stackMult(paramNumber(params, 'amount', 1), stackCount);
}

export function puzzleEffectModifiesInkMax(
  key: string,
  params: Record<string, string>,
  deckInkCount: number,
  stackCount = 1,
): number {
  if (key !== 'ink_max_bonus') return 0;
  if (deckInkCount < 3) return 0;
  return stackMult(paramNumber(params, 'deck3', 2), stackCount);
}
