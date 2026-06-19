import inkCards from '../data/ink-cards.json';
import conceptThresholds from '../data/concept-thresholds.json';
import type { ConceptThreshold, InkCard } from '../types/card';

class DataRegistry {
  private cards: InkCard[] = inkCards as InkCard[];
  private thresholds: ConceptThreshold[] = conceptThresholds as ConceptThreshold[];

  getAllCards(): InkCard[] {
    return this.cards.filter((c) => c.enabled);
  }

  getCardById(cardId: string): InkCard | undefined {
    return this.cards.find((c) => c.cardId === cardId);
  }

  getDraftPool(): InkCard[] {
    return this.getAllCards().filter((c) => c.draftWeight > 0);
  }

  getConceptThresholds(concept?: string): ConceptThreshold[] {
    if (!concept) return this.thresholds;
    return this.thresholds.filter((t) => t.concept === concept);
  }

  getStats() {
    const enabled = this.getAllCards();
    const byConcept = new Map<string, number>();
    for (const card of enabled) {
      byConcept.set(card.conceptPrimary, (byConcept.get(card.conceptPrimary) ?? 0) + 1);
    }
    return {
      totalCards: enabled.length,
      totalThresholds: this.thresholds.length,
      byConcept: Object.fromEntries(byConcept),
    };
  }
}

export const dataRegistry = new DataRegistry();
