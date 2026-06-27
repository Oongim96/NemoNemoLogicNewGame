import type { InkDeck } from '@modules/deck';
import type { PartyConfig } from '@modules/party';
import type { BattleResult, PuzzleRunCarryover, PuzzleRunModifiers } from '@modules/effects/domain/effect.types';
import { applyDeckThresholdModifiers } from '@modules/effects/battle/concept-threshold.service';
import { collectVarianceBattleMods } from '@modules/effects/battle/variance-battle.service';
import { buildBattlePlayback } from '@modules/effects/battle/battle-playback.service';
import {
  BattleState,
  createBattleInstances,
} from '@modules/effects/battle/battle-state.entity';

export interface AutoBattleInput {
  deck: InkDeck;
  party: PartyConfig;
  modifiers: PuzzleRunModifiers;
  carryover: PuzzleRunCarryover;
  enemyHp?: number;
  /** 덱 인덱스 순 — 배치 슬롯 순서대로 턴 합산·발동 */
  formationOrder?: number[];
}

export function prepareBattleState(input: AutoBattleInput): {
  state: BattleState;
  deck: InkDeck;
  party: PartyConfig;
} {
  const concept = input.party.members[0]?.primaryConcept ?? '잉크';
  const deckMods = applyDeckThresholdModifiers(input.deck, concept);
  const varianceMods = collectVarianceBattleMods(input.deck);
  const inkMaxBonus = input.modifiers.inkMaxStackBonus + deckMods.inkMaxBonus;
  const inkSeed = input.carryover.inkStackSeed + input.carryover.attackStackBonus;

  const instances = createBattleInstances(input.deck.getAll());
  const order = input.formationOrder;
  const ordered =
    order && order.length === instances.length
      ? order.map((i) => instances[i]!)
      : instances;

  for (const inst of ordered) {
    if (inst.card.conceptPrimary === '잉크' && deckMods.inkCardCooldownReduce > 0) {
      inst.cooldown = 0;
      inst.card = {
        ...inst.card,
        battleCooldown: Math.max(1, inst.card.battleCooldown - deckMods.inkCardCooldownReduce),
      };
    }
  }

  const state = new BattleState(ordered, {
    enemyHp: input.enemyHp ?? 2800,
    inkSeed,
    inkMaxBonus,
    varianceFloor: varianceMods.floor,
    varianceCeilingPct: varianceMods.ceilingPct,
  });

  return { state, deck: input.deck, party: input.party };
}

export function runAutoBattle(input: AutoBattleInput): BattleResult {
  const playback = buildBattlePlayback(input);
  const log = playback.events.map((e) => ({
    turn: e.turn,
    phase: e.phase,
    text: e.text,
  }));

  return {
    victory: playback.victory,
    turns: playback.turns,
    totalDamage: playback.totalDamage,
    log,
    turnSummaries: [],
  };
}
