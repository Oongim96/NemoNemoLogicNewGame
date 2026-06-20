import { parseEffectParams, paramBool, paramNumber } from '@modules/effects/domain/effect-params';
import type { BattleEffectContext, TurnAccumulator } from '@modules/effects/domain/effect.types';
import { createTurnAccumulator } from '@modules/effects/domain/effect.types';

type BattleHandler = (ctx: BattleEffectContext) => void;

function parseInlineParams(raw?: string): Record<string, string> {
  return parseEffectParams(raw?.startsWith(';') ? raw.slice(1) : raw);
}

const REGISTRY: Record<string, BattleHandler> = {
  deal_damage(ctx) {
    const base = ctx.card.battleValue ?? 0;
    const extra = parseInlineParams(ctx.card.battleEffectParam);
    ctx.turn.baseDamage += base;
    ctx.turn.hitCount += 1;
    const inkAdd = paramNumber(extra, 'ink_stack_add', 0);
    if (inkAdd > 0) {
      ctx.turn.inkStackGain += inkAdd;
      ctx.turn.messages.push(`${ctx.card.name}: ${base} + 잉크+${inkAdd}`);
    } else {
      ctx.turn.messages.push(`${ctx.card.name}: ${base} 피해`);
    }
  },

  ink_stack_add(ctx) {
    const amount = paramNumber(ctx.params, 'amount', ctx.card.battleValue ?? 1);
    ctx.turn.inkStackGain += amount;
    ctx.turn.messages.push(`${ctx.card.name}: 잉크 +${amount}`);
  },

  ink_splash_prep(ctx) {
    const pct = paramNumber(ctx.params, 'splash_pct', 60);
    ctx.turn.splashPct = Math.max(ctx.turn.splashPct, pct);
    ctx.turn.messages.push(`${ctx.card.name}: 범위 연출 준비 (${pct}%)`);
  },

  add_buff_pct(ctx) {
    const stat = ctx.params.stat ?? 'atk_pct';
    const val = ctx.card.battleValue ?? paramNumber(ctx.params, 'amount', 10);
    if (stat === 'atk_pct') {
      ctx.turn.atkBuffPct += val;
      ctx.turn.messages.push(`${ctx.card.name}: 공격 +${val}%`);
    }
  },

  ink_stack_consume_mult(ctx) {
    const mult = paramNumber(ctx.params, 'mult', 80);
    const buff = paramNumber(ctx.params, 'buff_atk_pct', 0);
    ctx.turn.inkStackConsume += 999;
    ctx.turn.baseDamage += mult;
    ctx.turn.hitCount += 1;
    if (buff > 0) ctx.turn.atkBuffPct += buff;
    if (paramBool(ctx.params, 'aoe')) {
      ctx.turn.aoeMult = Math.max(ctx.turn.aoeMult, mult);
      ctx.turn.messages.push(`${ctx.card.name}: 잉크 소모 광역 ×${mult}`);
    } else {
      ctx.turn.messages.push(`${ctx.card.name}: 잉크 소모 ×${mult}${buff ? ` +${buff}%` : ''}`);
    }
  },

  ink_explosion_if_turn(ctx) {
    const need = paramNumber(ctx.params, 'need_ink_cards', 3);
    const mult = paramNumber(ctx.params, 'mult', 100);
    if (ctx.inkCardsThisTurn >= need) {
      ctx.turn.forceExplosion = true;
      ctx.turn.aoeMult = Math.max(ctx.turn.aoeMult, mult);
      ctx.turn.messages.push(`${ctx.card.name}: 폭발 보조 (턴 잉크 ${ctx.inkCardsThisTurn}장)`);
    } else {
      ctx.turn.messages.push(`${ctx.card.name}: 조건 미달 (잉크 ${ctx.inkCardsThisTurn}/${need})`);
    }
  },
};

export function applyBattleEffectKey(key: string, ctx: BattleEffectContext): void {
  const handler = REGISTRY[key];
  if (!handler) {
    ctx.turn.messages.push(`[미구현 전투] ${key}`);
    return;
  }
  handler(ctx);
}

export function createEmptyTurn(): TurnAccumulator {
  return createTurnAccumulator();
}
