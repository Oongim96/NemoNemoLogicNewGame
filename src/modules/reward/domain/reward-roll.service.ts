import {
  DRAFT_BONUS_GOLD,
  EVENT_BUCKET_WEIGHTS,
  SECTION_CATEGORY_WEIGHTS,
} from '@modules/reward/domain/reward.constants';
import type {
  SectionAssignment,
  SectionReward,
  SectionRewardCategory,
  SectionRewardType,
} from '@modules/reward/domain/reward.types';

function rollDraftReward(rng: () => number): SectionReward {
  const span = DRAFT_BONUS_GOLD.max - DRAFT_BONUS_GOLD.min + 1;
  return { type: 'draft', goldAmount: DRAFT_BONUS_GOLD.min + Math.floor(rng() * span) };
}

function createDetailReward(type: SectionRewardType, rng: () => number): SectionReward {
  if (type === 'gold') {
    return { type, goldAmount: 12 + Math.floor(rng() * 14) };
  }
  if (type === 'draft') {
    return rollDraftReward(rng);
  }
  return { type };
}

function rollCategory(rng: () => number): SectionRewardCategory {
  const total = SECTION_CATEGORY_WEIGHTS.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const entry of SECTION_CATEGORY_WEIGHTS) {
    roll -= entry.weight;
    if (roll <= 0) return entry.category;
  }
  return 'draft';
}

export function rollEventBucketReward(rng: () => number = Math.random): SectionReward {
  const total = EVENT_BUCKET_WEIGHTS.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const entry of EVENT_BUCKET_WEIGHTS) {
    roll -= entry.weight;
    if (roll <= 0) return createDetailReward(entry.type, rng);
  }
  return createDetailReward('gold', rng);
}

export function requiresGuaranteedShop(mapGridSize: number, sectionCount: number): boolean {
  return mapGridSize >= 2 && sectionCount >= 4;
}

export function generateRunSectionAssignments(
  sectionCount: number,
  mapGridSize: number,
  rng: () => number = Math.random,
): SectionAssignment[] {
  const assignments: SectionAssignment[] = Array.from({ length: sectionCount }, () => {
    const category = rollCategory(rng);
    if (category === 'draft') {
      return { category, draftReward: rollDraftReward(rng) };
    }
    return { category };
  });

  if (
    requiresGuaranteedShop(mapGridSize, sectionCount) &&
    !assignments.some((a) => a.category === 'shop')
  ) {
    const idx = Math.floor(rng() * sectionCount);
    assignments[idx] = { category: 'shop' };
  }

  return assignments;
}

export function resolveSectionReward(
  assignment: SectionAssignment,
  rng: () => number = Math.random,
): SectionReward {
  switch (assignment.category) {
    case 'draft':
      return assignment.draftReward ?? rollDraftReward(rng);
    case 'shop':
      return { type: 'shop' };
    case 'event':
      return rollEventBucketReward(rng);
  }
}
