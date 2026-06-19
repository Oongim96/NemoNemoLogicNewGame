import type { Concept } from '@modules/card';

export interface PartyMember {
  id: string;
  name: string;
  primaryConcept: Concept;
  secondaryConcept?: Concept;
  uniqueCardIds: string[];
}

export interface PartyConfig {
  members: PartyMember[];
}
