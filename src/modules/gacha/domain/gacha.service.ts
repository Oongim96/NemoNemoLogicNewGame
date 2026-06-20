import { cardRepository, type CardGrade, type InkCard } from '@modules/card';
import {
  CARD_GRADE_LABEL,
  DUPLICATE_CARD_GEMS,
  DUPLICATE_CARD_GOLD,
  DUPLICATE_CHAR_GEMS,
  GACHA_CARD_GRADE_RATES,
  GACHA_CHARACTER_HIT_RATE,
  GACHA_CHARACTER_SSR_RATE,
  type GachaCardResult,
  type GachaCharacterResult,
  type GachaPullResult,
} from '@modules/gacha/domain/gacha.types';
import { CHARACTER_ROSTER, getCharacterDef } from '@modules/meta/domain/character-roster.data';
import type { PlayerProfile } from '@modules/meta/domain/player-profile.entity';

const START_CARD_IDS = new Set(['start_001', 'start_002']);

function pickRandom<T>(pool: T[], rng: () => number): T | undefined {
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length)];
}

function rollCardGrade(rng: () => number): CardGrade {
  const roll = rng();
  let acc = 0;
  for (const { grade, weight } of GACHA_CARD_GRADE_RATES) {
    acc += weight;
    if (roll < acc) return grade;
  }
  return 'common';
}

function gachaCardPool(grade: CardGrade): InkCard[] {
  return cardRepository.getAllCards().filter(
    (c) =>
      c.enabled &&
      c.draftWeight > 0 &&
      c.grade === grade &&
      !START_CARD_IDS.has(c.cardId),
  );
}

function rollCharacter(profile: PlayerProfile, rng: () => number): GachaCharacterResult {
  const grade = rng() < GACHA_CHARACTER_SSR_RATE ? 'SSR' : 'SR';
  const pool = CHARACTER_ROSTER.filter((c) => c.grade === grade);
  const pick = pickRandom(pool, rng) ?? pool[0]!;

  const isNew = !profile.ownsCharacter(pick.id);
  const uniqueCardsGranted: { cardId: string; name: string }[] = [];

  if (isNew) {
    profile.addCharacter(pick.id);
    for (const cardId of pick.uniqueCardIds) {
      const card = cardRepository.getCardById(cardId);
      if (card) {
        uniqueCardsGranted.push({ cardId, name: card.name });
      }
    }
    return {
      characterId: pick.id,
      name: pick.name,
      grade: pick.grade,
      isNew: true,
      duplicateGems: 0,
      uniqueCardsGranted,
    };
  }

  const duplicateGems = DUPLICATE_CHAR_GEMS[pick.grade];
  profile.addGems(duplicateGems);
  return {
    characterId: pick.id,
    name: pick.name,
    grade: pick.grade,
    isNew: false,
    duplicateGems,
    uniqueCardsGranted: [],
  };
}

function rollCard(profile: PlayerProfile, rng: () => number): GachaCardResult {
  let grade = rollCardGrade(rng);
  let pool = gachaCardPool(grade);

  if (pool.length === 0) {
    grade = 'common';
    pool = gachaCardPool('common');
  }
  if (pool.length === 0) {
    return {
      cardId: 'unknown',
      name: '???',
      grade: 'common',
      isNew: false,
      duplicateGold: 0,
      duplicateGems: 0,
    };
  }

  const pick = pickRandom(pool, rng)!;
  const isNew = !profile.ownsCard(pick.cardId);

  if (isNew) {
    profile.addCard(pick.cardId);
    return {
      cardId: pick.cardId,
      name: pick.name,
      grade: pick.grade,
      isNew: true,
      duplicateGold: 0,
      duplicateGems: 0,
    };
  }

  const duplicateGold = DUPLICATE_CARD_GOLD[pick.grade];
  const duplicateGems = DUPLICATE_CARD_GEMS[pick.grade];
  profile.addGold(duplicateGold);
  if (duplicateGems > 0) profile.addGems(duplicateGems);

  return {
    cardId: pick.cardId,
    name: pick.name,
    grade: pick.grade,
    isNew: false,
    duplicateGold,
    duplicateGems,
  };
}

/** 1회 — 캐릭터 또는 카드 하나 */
export function executeGachaPull(
  profile: PlayerProfile,
  rng: () => number = Math.random,
): GachaPullResult {
  if (rng() < GACHA_CHARACTER_HIT_RATE) {
    return { kind: 'character', character: rollCharacter(profile, rng) };
  }
  return { kind: 'card', card: rollCard(profile, rng) };
}

export function formatGachaPull(pull: GachaPullResult): string[] {
  if (pull.kind === 'character') {
    const c = pull.character;
    const charIcon = c.grade === 'SSR' ? '★' : '◆';
    if (c.isNew) {
      const lines = [`${charIcon} ${c.name} (${c.grade}) · NEW`];
      for (const u of c.uniqueCardsGranted) {
        lines.push(`   └ 고유 ${u.name}`);
      }
      return lines;
    }
    return [`${charIcon} ${c.name} (${c.grade}) · 중복 +💎${c.duplicateGems}`];
  }

  const card = pull.card;
  const label = CARD_GRADE_LABEL[card.grade];
  if (card.isNew) {
    return [`🃏 ${card.name} (${label}) · NEW`];
  }
  const extra = card.duplicateGems > 0 ? ` +💎${card.duplicateGems}` : '';
  return [`🃏 ${card.name} (${label}) · 중복 +🪙${card.duplicateGold}${extra}`];
}

export function formatGachaMultiPulls(pulls: GachaPullResult[]): string {
  return pulls
    .map((pull, i) => {
      const block = formatGachaPull(pull).join('\n');
      return pulls.length > 1 ? `[${i + 1}] ${block}` : block;
    })
    .join('\n\n');
}

/** @deprecated 테스트·호환 */
export function getCharacterDefForGacha(id: string) {
  return getCharacterDef(id);
}