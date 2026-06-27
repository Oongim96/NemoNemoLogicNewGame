import type { InkDeck } from '@modules/deck';
import type { PartyConfig } from '@modules/party';
import { parseEffectParams } from '@modules/effects/domain/effect-params';
import { applyCharacterBattlePassive, getCharacterPassives } from '@modules/effects/character/character-passive.service';
import { applyBattleEffectKey, createEmptyTurn } from '@modules/effects/battle/battle-effect.registry';
import type { BattlePlaybackEvent, BattlePlaybackResult } from '@modules/effects/battle/battle-playback.types';
import type { BattleState } from '@modules/effects/battle/battle-state.entity';
import {
  applyTurnThresholdToAccumulator,
  countConceptInTurn,
  getTurnThresholds,
} from '@modules/effects/battle/concept-threshold.service';
import { prepareBattleState, type AutoBattleInput } from '@modules/effects/battle/auto-battle.service';

const ENEMY_ATTACK = 2;
const MAX_TURNS = 30;

function pushEvent(
  events: BattlePlaybackEvent[],
  e: Omit<BattlePlaybackEvent, 'id'>,
): BattlePlaybackEvent {
  const ev: BattlePlaybackEvent = { ...e, id: events.length };
  events.push(ev);
  return ev;
}

function resolvePlayerTurnEvents(
  state: BattleState,
  deck: InkDeck,
  party: PartyConfig,
  events: BattlePlaybackEvent[],
): { damage: number; blockChance: number } {
  state.turn++;
  state.tickCooldowns();

  pushEvent(events, {
    phase: 'player',
    turn: state.turn,
    kind: 'turn_start',
    text: `── 턴 ${state.turn} ──`,
    partyHp: state.partyHp,
    enemyHp: state.enemyHp,
    inkStack: state.inkStack,
    enemyMaxHp: state.enemyMaxHp,
  });

  const ready = state.readyInstances();
  const acc = createEmptyTurn();
  const inkTurnCount = countConceptInTurn(ready, '잉크');
  const varTurnCount = countConceptInTurn(ready, '변동');

  const inkTurnThresholds = getTurnThresholds('잉크', inkTurnCount);
  const varTurnThresholds = getTurnThresholds('변동', varTurnCount);
  const thresholdMsgs: string[] = [];
  applyTurnThresholdToAccumulator('잉크', inkTurnCount, acc, inkTurnThresholds);
  applyTurnThresholdToAccumulator('변동', varTurnCount, acc, varTurnThresholds);
  for (const msg of acc.messages) thresholdMsgs.push(msg);
  acc.messages = [];

  if (thresholdMsgs.length > 0) {
    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'threshold',
      text: thresholdMsgs.join(' · '),
      inkStack: state.inkStack,
    });
  }

  for (const inst of ready) {
    const msgStart = acc.messages.length;
    const params = parseEffectParams(inst.card.battleEffectParam);
    applyBattleEffectKey(inst.card.battleEffectKey, {
      card: inst.card,
      deck,
      party,
      params,
      inkCardsThisTurn: inkTurnCount,
      turn: acc,
      varianceFloor: state.varianceFloor,
      varianceCeilingPct: state.varianceCeilingPct,
    });
    const cardMsg = acc.messages.slice(msgStart).join(' · ') || inst.card.name;

    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'card',
      text: cardMsg,
      cardName: inst.card.name,
      concept: inst.card.conceptPrimary,
      inkStack: state.inkStack,
    });
  }

  const inkBefore = state.inkStack;
  if (acc.inkStackGain > 0) state.addInk(acc.inkStackGain);
  if (state.inkStack !== inkBefore) {
    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'ink',
      text: `잉크 ${state.inkStack}/${state.inkMaxStack}`,
      inkStack: state.inkStack,
      value: state.inkStack - inkBefore,
    });
  }

  let damage = acc.baseDamage;
  if (acc.atkBuffPct > 0) {
    damage = Math.floor(damage * (1 + acc.atkBuffPct / 100));
  }

  if (acc.inkStackConsume > 0) {
    const stacks = state.consumeInk(state.inkStack);
    if (acc.aoeMult > 0 || acc.forceExplosion) {
      const mult = acc.aoeMult || 100;
      damage += stacks * mult;
      pushEvent(events, {
        phase: 'player',
        turn: state.turn,
        kind: 'ink',
        text: `잉크 ${stacks} 소모 → 광역 ×${mult}`,
        inkStack: state.inkStack,
        value: stacks,
      });
    } else {
      damage += stacks * (acc.baseDamage > 0 ? acc.baseDamage : 80);
      pushEvent(events, {
        phase: 'player',
        turn: state.turn,
        kind: 'ink',
        text: `잉크 ${stacks} 스택 소모`,
        inkStack: state.inkStack,
      });
    }
  }

  if (acc.forceExplosion && state.inkStack > 0) {
    const stacks = state.consumeInk(state.inkStack);
    const boom = stacks * (acc.aoeMult || 100);
    damage += boom;
    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'threshold',
      text: `잉크 폭발! ${stacks}×${acc.aoeMult || 100} = ${boom}`,
      inkStack: state.inkStack,
      value: boom,
    });
  }

  if (acc.splashPct > 0 && damage > 0) {
    const splash = Math.floor(damage * (acc.splashPct / 100));
    damage += splash;
    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'threshold',
      text: `스플래시 +${splash}`,
      value: splash,
    });
  }

  if (acc.enemyDebuffPct > 0 && damage > 0) {
    const bonus = Math.floor(damage * (acc.enemyDebuffPct / 100));
    damage += bonus;
    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'threshold',
      text: `변동 약화 +${bonus} (${acc.enemyDebuffPct}%)`,
      value: bonus,
    });
  }

  state.enemyHp = Math.max(0, state.enemyHp - damage);

  if (acc.shieldGain > 0) state.shield += acc.shieldGain;

  const charId = party.members[0]?.id;
  let heal = 0;
  if (charId) {
    const passive = getCharacterPassives(charId);
    if (passive) {
      const battlePassive = applyCharacterBattlePassive(passive, state.inkStack);
      heal = battlePassive.heal;
      if (heal > 0) {
        state.partyHp = Math.min(state.partyMaxHp, state.partyHp + heal);
        pushEvent(events, {
          phase: 'player',
          turn: state.turn,
          kind: 'heal',
          text: battlePassive.messages.join(' · ') || `HP +${heal}`,
          value: heal,
          partyHp: state.partyHp,
        });
      }
    }
  }

  state.startCooldowns(ready);

  if (damage > 0) {
    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'damage',
      text: `▶ ${damage} 피해!`,
      value: damage,
      enemyHp: state.enemyHp,
      enemyMaxHp: state.enemyMaxHp,
      inkStack: state.inkStack,
    });
  } else if (ready.length === 0) {
    pushEvent(events, {
      phase: 'player',
      turn: state.turn,
      kind: 'system',
      text: '발동 카드 없음 (쿨다운)',
      enemyHp: state.enemyHp,
      inkStack: state.inkStack,
    });
  }

  return { damage, blockChance: acc.pendingBlockChance };
}

function resolveEnemyTurnEvents(state: BattleState, events: BattlePlaybackEvent[], blockChance: number): void {
  let dmg = ENEMY_ATTACK;

  if (blockChance > 0 && Math.random() * 100 < blockChance) {
    pushEvent(events, {
      phase: 'enemy',
      turn: state.turn,
      kind: 'threshold',
      text: `🎲 막기 성공! (${Math.round(blockChance)}%)`,
      partyHp: state.partyHp,
      enemyHp: state.enemyHp,
    });
    dmg = 0;
  }

  if (dmg > 0 && state.shield > 0) {
    const absorbed = Math.min(state.shield, dmg);
    state.shield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) {
      pushEvent(events, {
        phase: 'enemy',
        turn: state.turn,
        kind: 'threshold',
        text: `실드 ${absorbed} 흡수`,
        partyHp: state.partyHp,
      });
    }
  }

  if (dmg > 0) {
    state.partyHp = Math.max(0, state.partyHp - dmg);
  }

  pushEvent(events, {
    phase: 'enemy',
    turn: state.turn,
    kind: 'enemy_hit',
    text: dmg > 0 ? `적 반격 — HP -${dmg}` : '적 공격 무효',
    value: dmg,
    partyHp: state.partyHp,
    enemyHp: state.enemyHp,
  });
}

export function buildBattlePlayback(input: AutoBattleInput): BattlePlaybackResult {
  const { state, party, deck } = prepareBattleState(input);
  const events: BattlePlaybackEvent[] = [];
  const charName = party.members[0]?.name ?? '파티';

  pushEvent(events, {
    phase: 'system',
    turn: 0,
    kind: 'system',
    text: `전투 시작 — ${charName}`,
    partyHp: state.partyHp,
    enemyHp: state.enemyHp,
    enemyMaxHp: state.enemyMaxHp,
    inkStack: state.inkStack,
  });

  pushEvent(events, {
    phase: 'system',
    turn: 0,
    kind: 'system',
    text: `덱 ${deck.size}장 · 잉크 ${state.inkStack}/${state.inkMaxStack}`,
    inkStack: state.inkStack,
  });

  if (state.varianceFloor > 0 || state.varianceCeilingPct > 0) {
    pushEvent(events, {
      phase: 'system',
      turn: 0,
      kind: 'system',
      text: `변동 보정 — 랜덤 최소 +${state.varianceFloor}${state.varianceCeilingPct > 0 ? ` · 천장 +${state.varianceCeilingPct}%` : ''}`,
      inkStack: state.inkStack,
    });
  }

  let totalDamage = 0;
  let turns = 0;

  while (!state.isVictory() && !state.isDefeat() && state.turn < MAX_TURNS) {
    const { damage, blockChance } = resolvePlayerTurnEvents(state, deck, party, events);
    totalDamage += damage;
    turns++;
    if (state.isVictory()) break;
    resolveEnemyTurnEvents(state, events, blockChance);
  }

  const victory = state.isVictory();

  pushEvent(events, {
    phase: 'system',
    turn: state.turn,
    kind: victory ? 'victory' : 'defeat',
    text: victory ? '승리!' : '패배…',
    partyHp: state.partyHp,
    enemyHp: state.enemyHp,
    enemyMaxHp: state.enemyMaxHp,
  });

  return { events, victory, turns, totalDamage };
}
