import Phaser from 'phaser';
import type { InkCard } from '@modules/card';
import { BATTLE_TYPE_KO, buildCardStrategyTags } from '@modules/card';
import { GAME_WIDTH } from '@app/game.config';
import { GRADE_BORDER } from '@ui/collection-detail-overlay';
import { addMiniCardChips } from '@ui/mini-card-chips';

export const INK_CARD_REF_W = 158;
export const INK_CARD_REF_H = 228;
export const INK_CARD_RATIO = INK_CARD_REF_W / INK_CARD_REF_H;

const CONCEPT_ICON: Record<string, string> = {
  잉크: '🖌',
  불꽃: '🔥',
  달빛: '🌙',
  철벽: '🛡',
  행운: '🍀',
  힌트: '💡',
  격자: '▦',
  저주: '☠',
};

export interface InkCardFaceData {
  slotLabel: string;
  title: string;
  detail: string;
  icon: string;
  borderColor: number;
  badge?: string | null;
  orderBadge?: string;
  tags?: string[];
}

export function inkCardFaceFromCard(
  card: InkCard,
  options?: { order?: number; slotLabel?: string; withTags?: boolean },
): InkCardFaceData {
  const typeKo = BATTLE_TYPE_KO[card.battleType] ?? card.battleType;
  return {
    slotLabel: options?.slotLabel ?? card.conceptPrimary,
    title: card.name,
    detail: `${typeKo} · 쿨${card.battleCooldown}`,
    icon: CONCEPT_ICON[card.conceptPrimary] ?? '🃏',
    borderColor: GRADE_BORDER[card.grade] ?? 0xaaaaaa,
    orderBadge: options?.order != null ? String(options.order) : undefined,
    tags: options?.withTags !== false ? buildCardStrategyTags(card) : undefined,
  };
}

function colorHex(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

export function buildInkCardFace(
  scene: Phaser.Scene,
  face: InkCardFaceData,
  w: number,
  h: number,
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const scale = w / INK_CARD_REF_W;
  const stroke = Math.max(3, Math.round(4 * scale));
  const borderColor = face.borderColor;

  const bg = scene.add.rectangle(0, 0, w, h, 0x1a1a2e).setStrokeStyle(stroke, borderColor);
  root.add(bg);

  const tintH = Math.max(18, Math.round(28 * scale));
  const gradeBar = scene.add
    .rectangle(0, -h / 2 + tintH / 2 + 4, w - stroke * 2, tintH, borderColor, 0.22)
    .setStrokeStyle(0);
  root.add(gradeBar);

  const slotLabel = scene.add
    .text(-w / 2 + 10, -h / 2 + tintH / 2 + 4, face.slotLabel, {
      fontFamily: 'sans-serif',
      fontSize: `${Math.max(9, Math.round(10 * scale))}px`,
      color: '#ddddee',
    })
    .setOrigin(0, 0.5);

  if (face.orderBadge) {
    const order = scene.add
      .text(-w / 2 + 10, -h / 2 + tintH + 8, face.orderBadge, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.max(14, Math.round(18 * scale))}px`,
        color: '#f5c842',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    root.add(order);
  }

  const icon = scene.add
    .text(0, -h * 0.06, face.icon, {
      fontFamily: 'sans-serif',
      fontSize: `${Math.max(18, Math.round(26 * scale))}px`,
      color: '#f0f0f5',
    })
    .setOrigin(0.5);

  const title = scene.add
    .text(0, h * 0.02, face.title, {
      fontFamily: 'sans-serif',
      fontSize: `${Math.max(11, Math.round(14 * scale))}px`,
      color: '#f0f0f5',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: w - 20 },
    })
    .setOrigin(0.5);

  root.add([slotLabel, icon, title]);

  if (face.tags && face.tags.length > 0) {
    addMiniCardChips(scene, root, face.tags, h / 2 - 6, borderColor, w - 10, scale);
  } else {
    const detail = scene.add
      .text(0, h * 0.2, face.detail, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.max(9, Math.round(10 * scale))}px`,
        color: colorHex(borderColor),
        align: 'center',
        wordWrap: { width: w - 16 },
      })
      .setOrigin(0.5);
    root.add(detail);
  }

  if (face.badge) {
    const badge = scene.add
      .text(w / 2 - 10, -h / 2 + tintH / 2 + 4, face.badge, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.max(8, Math.round(10 * scale))}px`,
        color: '#fff',
        backgroundColor: face.badge === 'NEW' ? '#7c5cff' : '#444466',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 0.5);
    root.add(badge);
  }

  return root;
}

export interface PortraitCardLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function computePortraitGridLayouts(
  count: number,
  area: { top: number; bottom: number; padX?: number },
  screenW: number,
): PortraitCardLayout[] {
  const padX = area.padX ?? 16;
  const areaH = area.bottom - area.top;
  const areaW = screenW - padX * 2;

  if (count === 1) {
    const w = Math.min(INK_CARD_REF_W, areaW);
    const h = w / INK_CARD_RATIO;
    return [{ x: screenW / 2, y: area.top + areaH / 2, w, h }];
  }

  if (count === 2) {
    const gap = 14;
    const w = Math.min(INK_CARD_REF_W, (areaW - gap) / 2);
    const h = w / INK_CARD_RATIO;
    const totalW = w * 2 + gap;
    const startX = (screenW - totalW) / 2 + w / 2;
    const y = area.top + areaH / 2;
    return [
      { x: startX, y, w, h },
      { x: startX + w + gap, y, w, h },
    ];
  }

  const cols = 2;
  const rows = Math.ceil(count / cols);
  const gapX = 12;
  const gapY = 8;
  const maxW = (areaW - gapX) / cols;
  const maxH = (areaH - gapY * (rows - 1)) / rows;

  let w = maxW;
  let h = w / INK_CARD_RATIO;
  if (h > maxH) {
    h = maxH;
    w = h * INK_CARD_RATIO;
  }

  const gridW = cols * w + gapX;
  const gridH = rows * h + gapY * (rows - 1);
  const startX = (screenW - gridW) / 2 + w / 2;
  const startY = area.top + (areaH - gridH) / 2 + h / 2;

  return Array.from({ length: count }, (_, i) => ({
    x: startX + (i % cols) * (w + gapX),
    y: startY + Math.floor(i / cols) * (h + gapY),
    w,
    h,
  }));
}

export const FORMATION_STRIP = {
  padX: 24,
  focusGap: 16,
  /** 겹칠 때 보이는 탭 너비 */
  peekW: 84,
  /** 이름·순번이 들어가는 탭 높이 */
  peekH: 96,
  /** 겹칠 때 옆 카드에 보이는 너비 비율 */
  peekOverlap: 0.5,
} as const;

export interface StripCardMetrics {
  fullW: number;
  fullH: number;
  peekW: number;
  peekH: number;
  peekStep: number;
  baseY: number;
}

export function computeStripCardMetrics(area: { top: number; bottom: number }): StripCardMetrics {
  const areaH = area.bottom - area.top;
  const fullH = Math.min(areaH - 24, 252);
  const fullW = fullH * INK_CARD_RATIO;
  const { peekW, peekH, peekOverlap } = FORMATION_STRIP;
  const peekStep = peekW * (1 - peekOverlap);
  const baseY = area.top + areaH * 0.56;
  return { fullW, fullH, peekW, peekH, peekStep, baseY };
}

export function computeSpreadStripPositions(
  count: number,
  focusSlot: number,
  metrics: StripCardMetrics,
): { x: number; focused: boolean }[] {
  if (count === 0) return [];

  const { padX, focusGap } = FORMATION_STRIP;
  const { fullW, peekW, peekStep } = metrics;
  const positions: { x: number; focused: boolean }[] = [];
  let cursor = padX;

  for (let i = 0; i < count; i++) {
    if (i === focusSlot) {
      positions.push({ x: cursor + fullW / 2, focused: true });
      cursor += fullW + focusGap;
    } else {
      positions.push({ x: cursor + peekW / 2, focused: false });
      cursor += peekStep;
    }
  }
  return positions;
}

export function spreadStripContentWidth(
  count: number,
  focusSlot: number,
  metrics: StripCardMetrics,
  padX = FORMATION_STRIP.padX,
): number {
  const positions = computeSpreadStripPositions(count, focusSlot, metrics);
  if (positions.length === 0) return 0;
  const last = positions[positions.length - 1]!;
  const tail = last.focused ? metrics.fullW : metrics.peekW;
  return last.x + tail / 2 + padX;
}

export interface FormationFanLayout extends PortraitCardLayout {
  rotation: number;
  baseX: number;
  baseY: number;
}

export function computeFormationFanLayouts(
  count: number,
  area: { top: number; bottom: number },
  screenW: number,
): FormationFanLayout[] {
  if (count === 0) return [];

  const areaH = area.bottom - area.top;
  const cardH = Math.min(areaH - 48, 228);
  const cardW = cardH * INK_CARD_RATIO;
  const overlap = 0.66;
  const step = cardW * (1 - overlap);
  const maxSpread = Phaser.Math.DegToRad(Math.min(30, 5 + count * 3.5));
  const baseY = area.top + areaH * 0.56;
  const totalSpan = cardW + step * Math.max(0, count - 1);
  const startX = (screenW - totalSpan) / 2 + cardW / 2;

  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const rotation = t * maxSpread;
    const x = startX + i * step;
    const y = baseY + Math.abs(t) * 16 + t * t * 10;
    return { x, y, w: cardW, h: cardH, rotation, baseX: x, baseY: y };
  });
}

export function fanContentWidth(layouts: FormationFanLayout[], pad = 28): number {
  if (layouts.length === 0) return 0;
  const last = layouts[layouts.length - 1]!;
  return last.x + last.w / 2 + pad;
}

export function computeFormationPeekStripLayouts(
  count: number,
  rowH: number,
): PortraitCardLayout[] {
  if (count === 0) return [];

  const padX = 20;
  const gap = 8;
  const peekW = 62;
  const peekH = rowH - 12;
  const y = rowH / 2;
  const startX = count === 1 ? GAME_WIDTH / 2 : padX + peekW / 2;

  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * (peekW + gap),
    y,
    w: peekW,
    h: peekH,
  }));
}

export function peekStripContentWidth(layouts: PortraitCardLayout[], padX = 20): number {
  if (layouts.length === 0) return 0;
  const last = layouts[layouts.length - 1]!;
  return last.x + last.w / 2 + padX;
}

export interface FormationStackLayout extends PortraitCardLayout {
  peekW: number;
  peekH: number;
  stackStep: number;
}

export const FORMATION_STACK = {
  step: 44,
  peekW: 66,
  peekH: 56,
  padX: 28,
  focusRadius: 96,
} as const;

export function buildFormationPeekFace(
  scene: Phaser.Scene,
  face: InkCardFaceData,
  w: number,
  h: number,
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const borderColor = face.borderColor;
  const left = -w / 2 + 8;

  const bg = scene.add.rectangle(0, 0, w, h, 0x14142a, 0.98).setStrokeStyle(2, borderColor);
  root.add(bg);

  root.add(
    scene.add.rectangle(-w / 2 + 1, 0, 3, h - 4, borderColor, 0.9).setOrigin(0, 0.5),
  );

  const headerY = -h / 2 + 6;
  if (face.orderBadge) {
    root.add(
      scene.add
        .text(left, headerY, face.orderBadge, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#f5c842',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0),
    );
  }

  root.add(
    scene.add.text(w / 2 - 6, headerY, face.icon, {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#bbbccc',
    }).setOrigin(1, 0),
  );

  root.add(
    scene.add
      .text(left, headerY + 18, face.title, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#f0f0f5',
        fontStyle: 'bold',
        align: 'left',
        wordWrap: { width: w - 14 },
      })
      .setOrigin(0, 0),
  );

  return root;
}

export function computeFormationStackLayouts(
  count: number,
  area: { top: number; bottom: number },
  screenW: number,
): FormationStackLayout[] {
  if (count === 0) return [];

  const { step, peekW, peekH, padX } = FORMATION_STACK;
  const fullH = area.bottom - area.top - 16;
  const fullW = fullH * INK_CARD_RATIO;
  const y = area.top + fullH / 2;
  const startX = count === 1 ? screenW / 2 : padX + peekW / 2;

  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * step,
    y,
    w: fullW,
    h: fullH,
    peekW,
    peekH,
    stackStep: step,
  }));
}

export function stackContentWidth(layouts: FormationStackLayout[], padX = FORMATION_STACK.padX): number {
  if (layouts.length === 0) return 0;
  const last = layouts[layouts.length - 1]!;
  return Math.max(last.x + last.peekW / 2, last.x + last.w / 2) + padX;
}

export function computeFormationStripLayouts(
  count: number,
  area: { top: number; bottom: number; padX?: number },
  screenW: number,
): PortraitCardLayout[] {
  if (count === 0) return [];

  const padX = area.padX ?? 16;
  const areaH = area.bottom - area.top;
  const gap = 10;
  const viewportW = screenW - padX * 2;
  const y = area.top + areaH / 2;

  let h = areaH - 12;
  let w = h * INK_CARD_RATIO;

  const fits = (cardW: number) => count * cardW + Math.max(0, count - 1) * gap <= viewportW;

  if (!fits(w)) {
    if (count <= 3) {
      w = (viewportW - gap * Math.max(0, count - 1)) / count;
      h = w / INK_CARD_RATIO;
    } else {
      w = Math.min(104, w);
      h = w / INK_CARD_RATIO;
    }
  }

  const totalW = count * w + Math.max(0, count - 1) * gap;
  const startX = totalW <= viewportW ? (screenW - totalW) / 2 + w / 2 : padX + w / 2;

  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * (w + gap),
    y,
    w,
    h,
  }));
}

export function stripContentWidth(layouts: PortraitCardLayout[], padX = 16): number {
  if (layouts.length === 0) return 0;
  const last = layouts[layouts.length - 1]!;
  return last.x + last.w / 2 + padX;
}
