import { DEFAULT_PARTY } from '@modules/party';
import {
  isOtherPartyUnique,
  isPartyUniqueCard,
} from '@modules/party/domain/party.helpers';
import { cardRepository } from '@modules/card';
import type { InkDeck } from '@modules/deck';
import type { RunDraftContext } from '@modules/run/domain/run-draft-context';
import type { CardGrade, Concept, InkCard } from '@modules/card';
import type { PartyConfig } from '@modules/party';

interface WeightedEntry {
  card: InkCard;
  weight: number;
}

function countPrimaryConceptInParty(concept: Concept, party: PartyConfig): number {
  return party.members.filter((m) => m.primaryConcept === concept).length;
}

function partyConceptMult(card: InkCard, party: PartyConfig): number {
  const primaryCount = countPrimaryConceptInParty(card.conceptPrimary, party);
  if (primaryCount >= 2) return 2.2;
  if (primaryCount === 1) return 1.8;

  if (card.conceptSecondary) {
    const secCount = party.members.filter(
      (m) => m.primaryConcept === card.conceptSecondary || m.secondaryConcept === card.conceptSecondary,
    ).length;
    if (secCount > 0) return 1.3;
  }

  const partyConcepts = new Set<Concept>();
  for (const m of party.members) {
    partyConcepts.add(m.primaryConcept);
    if (m.secondaryConcept) partyConcepts.add(m.secondaryConcept);
  }
  if (partyConcepts.has(card.conceptPrimary)) return 1.8;
  if (card.conceptSecondary && partyConcepts.has(card.conceptSecondary)) return 1.3;
  return 0.85;
}

function uniqueEarlyMult(
  card: InkCard,
  party: PartyConfig,
  run: RunDraftContext,
  deck: InkDeck,
): number {
  if (isOtherPartyUnique(card.cardId, party)) return 0;
  if (!isPartyUniqueCard(card.cardId, party)) return 1;

  const owned = deck.getAll().filter((c) => c.cardId === card.cardId).length;
  if (owned > 0) return 0.4;

  const cleared = run.completedCount;
  if (cleared <= 1) return 8;
  if (cleared <= 4) return 4;
  if (cleared <= 8) return 2;
  return 1.2;
}

function varietyMult(card: InkCard, deck: InkDeck): number {
  const sameId = deck.getAll().filter((c) => c.cardId === card.cardId).length;
  if (sameId >= 1) return 0.5;

  const hasConcept = deck.countByConcept(card.conceptPrimary) > 0;
  if (!hasConcept) return 1.15;
  return 1;
}

function filterGradeCap(cards: InkCard[], sectionsCleared: number): InkCard[] {
  if (sectionsCleared < 7) return cards.filter((c) => c.grade !== 'epic');
  return cards;
}

function canAddToDeck(card: InkCard, deck: InkDeck): boolean {
  const count = deck.getAll().filter((c) => c.cardId === card.cardId).length;
  return count < card.maxPerDeck;
}

export function computeCardWeight(
  card: InkCard,
  party: PartyConfig,
  run: RunDraftContext,
  deck: InkDeck,
): number {
  if (card.draftWeight <= 0) return 0;
  let w = card.draftWeight;
  w *= partyConceptMult(card, party);
  w *= uniqueEarlyMult(card, party, run, deck);
  w *= varietyMult(card, deck);
  return w;
}

function weightedPick(entries: WeightedEntry[], rng: () => number): InkCard | null {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.card;
  }
  return entries[entries.length - 1]?.card ?? null;
}

function buildWeightedPool(
  party: PartyConfig,
  run: RunDraftContext,
  deck: InkDeck,
): WeightedEntry[] {
  let pool = cardRepository.getDraftPool().filter((c) => canAddToDeck(c, deck));
  pool = filterGradeCap(pool, run.completedCount);
  pool = pool.filter((c) => !isOtherPartyUnique(c.cardId, party));

  return pool
    .map((card) => ({
      card,
      weight: computeCardWeight(card, party, run, deck),
    }))
    .filter((e) => e.weight > 0);
}

function isPartyConceptCard(card: InkCard, party: PartyConfig): boolean {
  return partyConceptMult(card, party) >= 1.3;
}

function applySlotRules(
  slots: InkCard[],
  party: PartyConfig,
  run: RunDraftContext,
  pool: WeightedEntry[],
  rng: () => number,
): InkCard[] {
  const result = [...slots];
  const cleared = run.completedCount;

  if (cleared <= 2) {
    const rares = result.filter((c) => c.grade !== 'common');
    if (rares.length > 1) {
      const commons = pool.filter((e) => e.card.grade === 'common');
      for (let i = 1; i < rares.length; i++) {
        const idx = result.indexOf(rares[i]);
        const replacement = weightedPick(commons, rng);
        if (replacement && idx >= 0) result[idx] = replacement;
      }
    }
  }

  if (!result.some((c) => isPartyConceptCard(c, party))) {
    const partyCards = pool.filter((e) => isPartyConceptCard(e.card, party));
    const best = weightedPick(partyCards, rng);
    if (best && result.length > 0) {
      result[result.length - 1] = best;
    }
  }

  return result;
}

function pickUniqueNotOwned(
  pool: WeightedEntry[],
  party: PartyConfig,
  deck: InkDeck,
  rng: () => number,
): InkCard | null {
  const uniques = pool.filter(
    (e) => isPartyUniqueCard(e.card.cardId, party) && deck.getAll().every((c) => c.cardId !== e.card.cardId),
  );
  return weightedPick(uniques, rng);
}

export function openDraft(
  run: RunDraftContext,
  deck: InkDeck,
  party: PartyConfig = DEFAULT_PARTY,
  rng: () => number = Math.random,
): InkCard[] {
  const pool = buildWeightedPool(party, run, deck);
  const slots: InkCard[] = [];
  const usedIds = new Set<string>();

  if (!run.hasDraftedBefore()) {
    const forced = pickUniqueNotOwned(pool, party, deck, rng);
    if (forced) {
      slots.push(forced);
      usedIds.add(forced.cardId);
    }
  }

  while (slots.length < 3) {
    const available = pool.filter((e) => !usedIds.has(e.card.cardId));
    const picked = weightedPick(available, rng);
    if (!picked) break;
    slots.push(picked);
    usedIds.add(picked.cardId);
  }

  run.markDraftOpened();
  return applySlotRules(slots, party, run, pool, rng);
}

export function getDraftBadge(card: InkCard, party: PartyConfig, deck: InkDeck): string | null {
  if (isPartyUniqueCard(card.cardId, party) && deck.getAll().every((c) => c.cardId !== card.cardId)) {
    return '고유';
  }
  if (partyConceptMult(card, party) >= 1.8) return '시너지';
  return null;
}

export function pickShopOffers(
  run: RunDraftContext,
  deck: InkDeck,
  party: PartyConfig = DEFAULT_PARTY,
  count = 3,
  rng: () => number = Math.random,
): InkCard[] {
  const pool = buildWeightedPool(party, run, deck);
  const offers: InkCard[] = [];
  const used = new Set<string>();

  while (offers.length < count) {
    const available = pool.filter((e) => !used.has(e.card.cardId));
    const picked = weightedPick(available, rng);
    if (!picked) break;
    offers.push(picked);
    used.add(picked.cardId);
  }

  return offers;
}

export function shopPrice(card: InkCard): number {
  const base = { common: 12, rare: 22, epic: 40 } satisfies Record<CardGrade, number>;
  return base[card.grade];
}

/** 상점 판매가 — 구매가의 50% */
export function sellPrice(card: InkCard): number {
  return Math.max(4, Math.floor(shopPrice(card) * 0.5));
}
