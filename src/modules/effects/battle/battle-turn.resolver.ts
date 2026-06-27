import type { InkDeck } from '@modules/deck';
import type { PartyConfig } from '@modules/party';
import { parseEffectParams } from '@modules/effects/domain/effect-params';
import type { BattleTurnSummary } from '@modules/effects/domain/effect.types';
import { applyCharacterBattlePassive, getCharacterPassives } from '@modules/effects/character/character-passive.service';
import { applyBattleEffectKey, createEmptyTurn } from '@modules/effects/battle/battle-effect.registry';
import type { BattleState, DeckCardInstance } from '@modules/effects/battle/battle-state.entity';
import {
  applyTurnThresholdToAccumulator,
  countConceptInTurn,
  getTurnThresholds,
} from '@modules/effects/battle/concept-threshold.service';

const ENEMY_ATTACK = 2;

export function resolvePlayerTurn(
  state: BattleState,
  deck: InkDeck,
  party: PartyConfig,
): BattleTurnSummary {
  state.turn++;
  state.tickCooldowns();

  const ready = state.readyInstances();
  const acc = createEmptyTurn();
  const inkTurnCount = countConceptInTurn(ready, '잉크');

  const turnThresholds = getTurnThresholds('잉크', inkTurnCount);
  applyTurnThresholdToAccumulator('잉크', inkTurnCount, acc, turnThresholds);

  for (const inst of ready) {
    const params = parseEffectParams(inst.card.battleEffectParam);
    applyBattleEffectKey(inst.card.battleEffectKey, {
      card: inst.card,
      deck,
      party,
      params,
      inkCardsThisTurn: inkTurnCount,
      turn: acc,
      varianceFloor: 0,
      varianceCeilingPct: 0,
    });
  }

  if (acc.inkStackGain > 0) state.addInk(acc.inkStackGain);

  let damage = acc.baseDamage;
  if (acc.atkBuffPct > 0) {
    damage = Math.floor(damage * (1 + acc.atkBuffPct / 100));
  }

  if (acc.inkStackConsume > 0) {
    const stacks = state.consumeInk(state.inkStack);
    if (acc.aoeMult > 0 || acc.forceExplosion) {
      const mult = acc.aoeMult || 100;
      damage += stacks * mult;
      acc.messages.push(`잉크 ${stacks} 소모 → +${stacks * mult} 광역`);
    } else {
      damage += stacks * (acc.baseDamage > 0 ? acc.baseDamage : 80);
      acc.messages.push(`잉크 ${stacks} 스택 소모`);
    }
  }

  if (acc.forceExplosion && state.inkStack > 0) {
    const stacks = state.consumeInk(state.inkStack);
    const boom = stacks * (acc.aoeMult || 100);
    damage += boom;
    acc.messages.push(`잉크 폭발: ${stacks}×${acc.aoeMult || 100} = ${boom}`);
  }

  if (acc.splashPct > 0 && damage > 0) {
    const splash = Math.floor(damage * (acc.splashPct / 100));
    damage += splash;
    acc.messages.push(`스플래시 +${splash} (${acc.splashPct}%)`);
  }

  damage = Math.max(0, damage - Math.floor(state.shield * 0));
  state.enemyHp = Math.max(0, state.enemyHp - damage);

  if (acc.shieldGain > 0) state.shield += acc.shieldGain;

  const charId = party.members[0]?.id;
  let heal = 0;
  if (charId) {
    const passive = getCharacterPassives(charId);
    if (passive) {
      const battlePassive = applyCharacterBattlePassive(passive, state.inkStack);
      heal = battlePassive.heal;
      acc.messages.push(...battlePassive.messages);
      state.partyHp = Math.min(state.partyMaxHp, state.partyHp + heal);
    }
  }

  state.startCooldowns(ready);

  for (const msg of acc.messages) state.addLog('player', msg);
  state.addLog('player', `→ 적에게 ${damage} 피해 (잉크 ${state.inkStack})`);

  return {
    turn: state.turn,
    cardsPlayed: ready.map((r) => r.card.name),
    damageDealt: damage,
    healAmount: heal,
    inkStackAfter: state.inkStack,
    enemyHpAfter: state.enemyHp,
    logs: [...acc.messages, `피해 ${damage}`],
  };
}

export function resolveEnemyTurn(state: BattleState): void {
  const dmg = ENEMY_ATTACK;
  state.partyHp = Math.max(0, state.partyHp - dmg);
  state.addLog('enemy', `적 반격 — HP -${dmg}`);
}

export function runBattleLoop(
  state: BattleState,
  deck: InkDeck,
  party: PartyConfig,
  maxTurns = 30,
): { victory: boolean; summaries: BattleTurnSummary[] } {
  const summaries: BattleTurnSummary[] = [];

  while (!state.isVictory() && !state.isDefeat() && state.turn < maxTurns) {
    summaries.push(resolvePlayerTurn(state, deck, party));
    if (state.isVictory()) break;
    resolveEnemyTurn(state);
  }

  return { victory: state.isVictory(), summaries };
}

export function getInitialReadyPreview(instances: DeckCardInstance[]): string[] {
  return instances.filter((i) => i.cooldown <= 0).map((i) => i.card.name);
}
