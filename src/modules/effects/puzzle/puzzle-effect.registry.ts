import type { InkCard } from '@modules/card';
import type { CellState } from '@modules/puzzle';
import { paramNumber } from '@modules/effects/domain/effect-params';
import type { PuzzleEffectResult, PuzzleRunModifiers } from '@modules/effects/domain/effect.types';
import { emptyPuzzleResult } from '@modules/effects/domain/effect.types';
import {
  pickAdjacentUnresolved,
  pickCrossUnresolved,
  pickRandomUnresolvedCells,
} from '@modules/effects/puzzle/puzzle-session.entity';

export interface PuzzleEffectContext {
  card: InkCard;
  params: Record<string, string>;
  solution: number[][];
  grid: CellState[][];
  cell?: { x: number; y: number };
  line?: { axis: 'row' | 'col'; index: number };
  modifiers: PuzzleRunModifiers;
  deckInkCount: number;
}

type PuzzleHandler = (ctx: PuzzleEffectContext) => PuzzleEffectResult;

const REGISTRY: Record<string, PuzzleHandler> = {
  reveal_cross_1(ctx) {
    const range = paramNumber(ctx.params, 'range', 1);
    const cell = ctx.cell;
    if (!cell) return emptyPuzzleResult();
    const deckBonus = ctx.deckInkCount >= 3 ? 1 : 0;
    const cells = pickCrossUnresolved(ctx.solution, ctx.grid, cell.x, cell.y, range + deckBonus);
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 십자 힌트 ${cells.length}칸`],
      reveals: cells.map(({ x, y }) => ({ x, y, shouldFill: ctx.solution[y][x] === 1 })),
    };
  },

  reveal_adjacent_2(ctx) {
    const count = paramNumber(ctx.params, 'count', 2);
    const cell = ctx.cell;
    if (!cell) return emptyPuzzleResult();
    const cells = pickAdjacentUnresolved(ctx.solution, ctx.grid, cell.x, cell.y, count);
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 인접 ${cells.length}칸 공개`],
      reveals: cells.map(({ x, y }) => ({ x, y, shouldFill: ctx.solution[y][x] === 1 })),
    };
  },

  reveal_random(ctx) {
    const count = paramNumber(ctx.params, 'cells', 3);
    const cells = pickRandomUnresolvedCells(ctx.solution, ctx.grid, count);
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 랜덤 ${cells.length}칸 공개`],
      reveals: cells.map(({ x, y }) => ({ x, y, shouldFill: ctx.solution[y][x] === 1 })),
    };
  },

  highlight_line(ctx) {
    const sec = paramNumber(ctx.params, 'sec', 1);
    const line = ctx.line;
    if (!line) return emptyPuzzleResult();
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 줄 강조`],
      highlightLine: { ...line, durationSec: sec },
    };
  },

  mistake_reduce(ctx) {
    const amount = paramNumber(ctx.params, 'amount', 1);
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 실수 피해 -${amount}`],
      // applied via modifiers merge in service
      heal: 0,
      gold: 0,
      inkStackDelta: 0,
      attackStackDelta: 0,
      // hack: use negative in message only; service reads param
    };
  },

  ink_max_bonus(ctx) {
    const bonus = paramNumber(ctx.params, 'deck3', 2);
    if (ctx.deckInkCount < 3) return emptyPuzzleResult();
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 잉크 스택 상한 +${bonus}`],
    };
  },

  curse_to_atk_stack(ctx) {
    const per = paramNumber(ctx.params, 'per_mistake', 1);
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 공격 스택 +${per}`],
      attackStackDelta: per,
    };
  },

  ink_on_line(ctx) {
    return {
      ...emptyPuzzleResult(),
      messages: [`${ctx.card.name}: 줄 완성 잉크 +1`],
      inkStackDelta: 1,
    };
  },
};

export function applyPuzzleEffectKey(key: string, ctx: PuzzleEffectContext): PuzzleEffectResult {
  const handler = REGISTRY[key];
  if (!handler) {
    return { ...emptyPuzzleResult(), messages: [`[미구현 퍼즐] ${key}`] };
  }
  return handler(ctx);
}

/** passive mistake_reduce는 modifiers에 반영 */
export function puzzleEffectModifiesMistakeReduce(key: string, params: Record<string, string>): number {
  if (key !== 'mistake_reduce') return 0;
  return paramNumber(params, 'amount', 1);
}

export function puzzleEffectModifiesInkMax(key: string, params: Record<string, string>, deckInkCount: number): number {
  if (key !== 'ink_max_bonus') return 0;
  if (deckInkCount < 3) return 0;
  return paramNumber(params, 'deck3', 2);
}
