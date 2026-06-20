import type { InkCard } from '@modules/card';

export interface DeckCardInstance {
  instanceId: string;
  card: InkCard;
  cooldown: number;
}

export class BattleState {
  enemyHp: number;
  enemyMaxHp: number;
  partyHp: number;
  partyMaxHp: number;
  inkStack = 0;
  inkMaxStack = 10;
  shield = 0;
  atkBuffPct = 0;
  turn = 0;
  instances: DeckCardInstance[];
  log: { turn: number; phase: 'player' | 'enemy' | 'system'; text: string }[] = [];

  constructor(instances: DeckCardInstance[], options?: { enemyHp?: number; inkSeed?: number; inkMaxBonus?: number }) {
    this.instances = instances;
    this.enemyMaxHp = options?.enemyHp ?? 3000;
    this.enemyHp = this.enemyMaxHp;
    this.partyMaxHp = 10;
    this.partyHp = this.partyMaxHp;
    this.inkMaxStack = 10 + (options?.inkMaxBonus ?? 0);
    this.inkStack = Math.min(this.inkMaxStack, options?.inkSeed ?? 0);
  }

  addLog(phase: 'player' | 'enemy' | 'system', text: string): void {
    this.log.push({ turn: this.turn, phase, text });
  }

  tickCooldowns(): void {
    for (const inst of this.instances) {
      if (inst.cooldown > 0) inst.cooldown--;
    }
  }

  readyInstances(): DeckCardInstance[] {
    return this.instances.filter((i) => i.cooldown <= 0);
  }

  startCooldowns(used: DeckCardInstance[]): void {
    for (const inst of used) {
      inst.cooldown = inst.card.battleCooldown;
    }
  }

  addInk(amount: number): void {
    this.inkStack = Math.min(this.inkMaxStack, this.inkStack + amount);
  }

  consumeInk(amount: number): number {
    const consumed = Math.min(this.inkStack, amount);
    this.inkStack -= consumed;
    return consumed;
  }

  isVictory(): boolean {
    return this.enemyHp <= 0;
  }

  isDefeat(): boolean {
    return this.partyHp <= 0;
  }
}

export function createBattleInstances(deckCards: readonly InkCard[]): DeckCardInstance[] {
  const counter = new Map<string, number>();
  return deckCards.map((card) => {
    const n = (counter.get(card.cardId) ?? 0) + 1;
    counter.set(card.cardId, n);
    return {
      instanceId: `${card.cardId}#${n}`,
      card,
      cooldown: 0,
    };
  });
}
