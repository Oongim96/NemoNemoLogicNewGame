import {
  CARD_GRADE_LABEL,
  type GachaCardResult,
  type GachaCharacterResult,
  type GachaPullResult,
} from '@modules/gacha/domain/gacha.types';

export interface GachaRevealFace {
  slotLabel: string;
  hit: boolean;
  title: string;
  detail: string;
  badge: string | null;
  borderColor: number;
  icon: string;
}

export interface GachaRevealTile {
  faces: GachaRevealFace[];
  pullIndex?: number;
}

const BORDER = {
  SSR: 0xffd700,
  SR: 0x9b8aff,
  epic: 0xffb347,
  rare: 0x7c5cff,
  common: 0xaaaaaa,
  empty: 0x3a3a55,
} as const;

function characterFace(character: GachaCharacterResult): GachaRevealFace {
  const borderColor = character.grade === 'SSR' ? BORDER.SSR : BORDER.SR;
  const icon = character.grade === 'SSR' ? '★' : '◆';

  if (character.isNew) {
    const unique =
      character.uniqueCardsGranted.length > 0
        ? `고유 ${character.uniqueCardsGranted.map((c) => c.name).join(', ')}`
        : '';
    return {
      slotLabel: '캐릭터',
      hit: true,
      title: character.name,
      detail: unique || character.grade,
      badge: 'NEW',
      borderColor,
      icon,
    };
  }

  return {
    slotLabel: '캐릭터',
    hit: true,
    title: character.name,
    detail: `${character.grade} · 중복`,
    badge: `+💎${character.duplicateGems}`,
    borderColor,
    icon,
  };
}

function cardHitFace(card: GachaCardResult): GachaRevealFace {
  const borderColor =
    card.grade === 'epic'
      ? BORDER.epic
      : card.grade === 'rare'
        ? BORDER.rare
        : BORDER.common;

  if (card.isNew) {
    return {
      slotLabel: '카드',
      hit: true,
      title: card.name,
      detail: CARD_GRADE_LABEL[card.grade],
      badge: 'NEW',
      borderColor,
      icon: '🃏',
    };
  }

  const extra = card.duplicateGems > 0 ? ` +💎${card.duplicateGems}` : '';
  return {
    slotLabel: '카드',
    hit: true,
    title: card.name,
    detail: `${CARD_GRADE_LABEL[card.grade]} · 중복`,
    badge: `+🪙${card.duplicateGold}${extra}`,
    borderColor,
    icon: '🃏',
  };
}

function faceFromPull(pull: GachaPullResult): GachaRevealFace {
  return pull.kind === 'character' ? characterFace(pull.character) : cardHitFace(pull.card);
}

/** 1회 — 1장 */
export function buildSinglePullTiles(pull: GachaPullResult): GachaRevealTile[] {
  return [{ faces: [faceFromPull(pull)] }];
}

/** 10회 — 회당 1장 */
export function buildMultiPullTiles(pulls: GachaPullResult[]): GachaRevealTile[] {
  return pulls.map((pull, index) => ({
    pullIndex: index + 1,
    faces: [faceFromPull(pull)],
  }));
}

export function pickTileBorderColor(faces: GachaRevealFace[]): number {
  const priority = [BORDER.SSR, BORDER.epic, BORDER.SR, BORDER.rare, BORDER.common];
  for (const color of priority) {
    if (faces.some((f) => f.hit && f.borderColor === color)) return color;
  }
  return BORDER.empty;
}
