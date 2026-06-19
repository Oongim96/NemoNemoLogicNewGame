import type { InkCard } from '../types/card';

/** 런 중 잉크 덱 상태 (초기 스텁) */
export class InkDeck {
  private cards: InkCard[] = [];

  constructor(initial: InkCard[] = []) {
    this.cards = [...initial];
  }

  get size(): number {
    return this.cards.length;
  }

  getAll(): readonly InkCard[] {
    return this.cards;
  }

  add(card: InkCard): boolean {
    const count = this.cards.filter((c) => c.cardId === card.cardId).length;
    if (count >= card.maxPerDeck) return false;
    this.cards.push(card);
    return true;
  }

  countByConcept(concept: string): number {
    return this.cards.filter(
      (c) => c.conceptPrimary === concept || c.conceptSecondary === concept,
    ).length;
  }
}
