import { parseEffectParams, paramBool, paramNumber } from '@modules/effects/domain/effect-params';

import type { BattleEffectContext, TurnAccumulator } from '@modules/effects/domain/effect.types';

import { createTurnAccumulator } from '@modules/effects/domain/effect.types';

import { rollVarianceInt } from '@modules/effects/battle/variance-battle.util';



type BattleHandler = (ctx: BattleEffectContext) => void;



function parseInlineParams(raw?: string): Record<string, string> {

  return parseEffectParams(raw?.startsWith(';') ? raw.slice(1) : raw);

}



function varianceCtx(ctx: BattleEffectContext) {

  return {

    floor: ctx.varianceFloor,

    ceilingPct: ctx.varianceCeilingPct,

    turn: ctx.turn,

  };

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



  random_damage(ctx) {

    const min = ctx.card.battleValue ?? paramNumber(ctx.params, 'min', 40);

    const max = ctx.card.battleValueMax ?? paramNumber(ctx.params, 'max', 120);

    let bonusFloor = 0;

    if (paramBool(ctx.params, 'luck_floor_per_card')) {

      bonusFloor += ctx.deck.countByConcept('행운') * paramNumber(ctx.params, 'luck_floor', 3);

    }

    if (paramBool(ctx.params, 'min_add_curse_stack')) {

      bonusFloor += ctx.deck.countByConcept('저주');

    }

    const rolled = rollVarianceInt(min, max, {

      ...varianceCtx(ctx),

      floor: ctx.varianceFloor + bonusFloor,

    });

    ctx.turn.baseDamage += rolled;

    ctx.turn.hitCount += 1;

    ctx.turn.messages.push(`${ctx.card.name}: 🎲 ${rolled} 피해 (${min}~${max})`);

    const debuffMin = paramNumber(ctx.params, 'debuff_min', 0);
    const debuffMax = paramNumber(ctx.params, 'debuff_max', 0);
    if (debuffMax > 0) {
      const debuff = rollVarianceInt(debuffMin, debuffMax, varianceCtx(ctx));
      ctx.turn.enemyDebuffPct += debuff;
      ctx.turn.messages.push(`${ctx.card.name}: 🎲 약화 +${debuff}%`);
    }
  },



  add_shield(ctx) {

    const amount = ctx.card.battleValue ?? paramNumber(ctx.params, 'amount', 25);

    ctx.turn.shieldGain += amount;

    ctx.turn.messages.push(`${ctx.card.name}: 실드 +${amount}`);

  },



  random_shield(ctx) {

    const min = ctx.card.battleValue ?? paramNumber(ctx.params, 'min', 15);

    const max = ctx.card.battleValueMax ?? paramNumber(ctx.params, 'max', 50);

    const rolled = rollVarianceInt(min, max, varianceCtx(ctx));

    ctx.turn.shieldGain += rolled;

    ctx.turn.messages.push(`${ctx.card.name}: 🎲 실드 +${rolled} (${min}~${max})`);

  },



  random_buff_pct(ctx) {

    const stat = ctx.params.stat ?? 'atk_pct';

    const min = ctx.card.battleValue ?? paramNumber(ctx.params, 'min', 5);

    const max = ctx.card.battleValueMax ?? paramNumber(ctx.params, 'max', 25);

    const rolled = rollVarianceInt(min, max, varianceCtx(ctx));

    if (stat === 'atk_pct') {

      ctx.turn.atkBuffPct += rolled;

      ctx.turn.messages.push(`${ctx.card.name}: 🎲 공격 +${rolled}% (${min}~${max})`);

    }

  },



  random_debuff_pct(ctx) {

    const min = paramNumber(ctx.params, 'min', 5);

    const max = paramNumber(ctx.params, 'max', 20);

    const rolled = rollVarianceInt(min, max, varianceCtx(ctx));

    ctx.turn.enemyDebuffPct += rolled;

    ctx.turn.messages.push(`${ctx.card.name}: 🎲 적 약화 +${rolled}% (${min}~${max})`);

  },



  random_block_roll(ctx) {

    const chanceMin = paramNumber(ctx.params, 'chance_min', 30);

    const chanceMax = paramNumber(ctx.params, 'chance_max', 70);

    const shieldMin = paramNumber(ctx.params, 'shield_min', 10);

    const shieldMax = paramNumber(ctx.params, 'shield_max', 40);

    const chance = rollVarianceInt(chanceMin, chanceMax, varianceCtx(ctx));

    ctx.turn.pendingBlockChance = Math.max(ctx.turn.pendingBlockChance, chance);

    const shield = rollVarianceInt(shieldMin, shieldMax, varianceCtx(ctx));

    ctx.turn.shieldGain += shield;

    ctx.turn.messages.push(

      `${ctx.card.name}: 🎲 막기 ${chance}% · 실드 +${shield}`,

    );

  },



  variance_floor_boost(ctx) {

    const floor = paramNumber(ctx.params, 'floor', 5);

    ctx.turn.varianceFloorBonus += floor;

    ctx.turn.messages.push(`${ctx.card.name}: 이번 턴 랜덤 최소 +${floor}`);

  },



  variance_floor_anchor(ctx) {

    ctx.turn.messages.push(`${ctx.card.name}: 확률의 닻 (덱 앵커)`);

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


