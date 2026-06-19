import type { Concept } from '@modules/card';
import { DEFAULT_PARTY } from '@modules/party/domain/default-party.data';
import type { PartyConfig } from '@modules/party/domain/party.types';

const UNIQUE_OWNER = new Map<string, string>();
for (const member of DEFAULT_PARTY.members) {
  for (const cardId of member.uniqueCardIds) {
    UNIQUE_OWNER.set(cardId, member.id);
  }
}

export function getUniqueOwner(cardId: string): string | undefined {
  return UNIQUE_OWNER.get(cardId);
}

export function isPartyUniqueCard(cardId: string, party: PartyConfig): boolean {
  return party.members.some((m) => m.uniqueCardIds.includes(cardId));
}

export function isOtherPartyUnique(cardId: string, party: PartyConfig): boolean {
  const owner = UNIQUE_OWNER.get(cardId);
  if (!owner) return false;
  return !party.members.some((m) => m.id === owner);
}

export function getPartyConcepts(party: PartyConfig): Concept[] {
  const concepts = new Set<Concept>();
  for (const m of party.members) {
    concepts.add(m.primaryConcept);
    if (m.secondaryConcept) concepts.add(m.secondaryConcept);
  }
  return [...concepts];
}
