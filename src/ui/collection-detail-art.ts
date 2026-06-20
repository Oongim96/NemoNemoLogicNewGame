import Phaser from 'phaser';

export interface DetailArtOptions {
  kind: 'character' | 'card';
  borderColor: number;
  conceptPrimary: string;
  gradeLabel?: string;
  icon?: string;
  locked?: boolean;
  /** Phaser texture key — 있으면 일러스트 사용 */
  textureKey?: string;
}

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

const CONCEPT_TINT: Record<string, number> = {
  잉크: 0x2a1a4a,
  불꽃: 0x4a1818,
  달빛: 0x1a2848,
  철벽: 0x283038,
  행운: 0x1a3828,
  힌트: 0x2a2840,
  격자: 0x222838,
  저주: 0x2a1830,
};

export function characterPortraitKey(characterId: string): string {
  return `char_portrait_${characterId}`;
}

export function cardArtKey(cardId: string): string {
  return `card_art_${cardId}`;
}

function blendColor(color: number, base: number, t: number): number {
  const mix = (c: number, b: number) => Math.round(b + (c - b) * t);
  const r = mix((color >> 16) & 0xff, (base >> 16) & 0xff);
  const g = mix((color >> 8) & 0xff, (base >> 8) & 0xff);
  const b = mix(color & 0xff, base & 0xff);
  return (r << 16) | (g << 8) | b;
}

function colorHex(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

/** artRoot 로컬 좌표 — 캡션(칩 포함) 하단 y */
export function getDetailArtCaptionBottom(
  h: number,
  subtitle?: string,
  chips?: string[],
): number {
  const titleY = h / 2 - 28;
  let chipY = titleY + 6;
  if (subtitle) chipY += 20;
  if (chips && chips.length > 0) {
    const chipH = 22;
    return chipY + 10 + chipH / 2;
  }
  if (subtitle) return chipY + 14;
  return titleY;
}

/** 상단 일러스트 영역 — 텍스처 없으면 컨셉 플레이스홀더 */
export function drawDetailArt(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  w: number,
  h: number,
  options: DetailArtOptions,
): Phaser.GameObjects.Container {
  const root = scene.add.container(cx, cy);
  const locked = options.locked ?? false;
  const stroke = 3;
  const icon = options.icon ?? CONCEPT_ICON[options.conceptPrimary] ?? '✦';
  const bgTint = locked ? 0x14141f : (CONCEPT_TINT[options.conceptPrimary] ?? 0x1a1a2e);
  const borderColor = locked ? 0x444455 : options.borderColor;

  const frame = scene.add
    .rectangle(0, 0, w, h, bgTint)
    .setStrokeStyle(stroke, borderColor);
  root.add(frame);

  const innerGlow = scene.add
    .rectangle(0, -h * 0.08, w - 12, h * 0.55, blendColor(borderColor, bgTint, 0.35), 0.5);
  root.add(innerGlow);

  const resolvedKey =
    options.textureKey && scene.textures.exists(options.textureKey) ? options.textureKey : null;

  if (resolvedKey && !locked) {
    const img = scene.add.image(0, 0, resolvedKey);
    const scale = Math.min((w - 16) / img.width, (h - 16) / img.height);
    img.setScale(scale);
    root.add(img);
  } else if (options.kind === 'character') {
    const r = Math.min(w, h) * 0.28;
    const ring = scene.add
      .circle(0, -h * 0.04, r + 6, 0x000000, 0.35);
    const portrait = scene.add
      .circle(0, -h * 0.04, r, 0x0d0d14)
      .setStrokeStyle(3, borderColor);
    const face = scene.add
      .text(0, -h * 0.04, locked ? '🔒' : icon, {
        fontSize: `${Math.round(r * 1.1)}px`,
      })
      .setOrigin(0.5);
    root.add([ring, portrait, face]);
  } else {
    const cardW = w * 0.42;
    const cardH = cardW * (228 / 158);
    const cardY = -h * 0.02;
    const cardBg = scene.add
      .rectangle(0, cardY, cardW, cardH, 0x0d0d14)
      .setStrokeStyle(2, borderColor);
    const cardIcon = scene.add
      .text(0, cardY - cardH * 0.12, locked ? '?' : icon, {
        fontSize: `${Math.round(cardW * 0.35)}px`,
      })
      .setOrigin(0.5);
    const cardShine = scene.add
      .rectangle(0, cardY - cardH * 0.28, cardW - 8, cardH * 0.18, borderColor, 0.15);
    root.add([cardBg, cardShine, cardIcon]);
  }

  if (options.gradeLabel) {
    const badge = scene.add
      .text(-w / 2 + 14, -h / 2 + 14, options.gradeLabel, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#fff',
        backgroundColor: colorHex(borderColor),
        padding: { x: 6, y: 3 },
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    root.add(badge);
  }

  return root;
}

export interface DetailArtCaption {
  title: string;
  subtitle?: string;
  chips?: string[];
  borderColor: number;
}

/** 카드 프레임 안 하단 — 배경·테두리 위 레이어 */
export function addDetailArtCaption(
  scene: Phaser.Scene,
  artRoot: Phaser.GameObjects.Container,
  w: number,
  h: number,
  caption: DetailArtCaption,
): void {
  const fadeH = Math.max(52, h * 0.34);
  const fade = scene.add
    .rectangle(0, h / 2 - fadeH / 2, w - 6, fadeH, 0x0d0d14, 0.88);
  artRoot.add(fade);

  const titleY = h / 2 - 28;
  const title = scene.add
    .text(0, titleY, caption.title, {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#f0f0f5',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: w - 32 },
    })
    .setOrigin(0.5, 1);
  artRoot.add(title);

  let chipY = titleY + 6;
  if (caption.subtitle) {
    const sub = scene.add
      .text(0, chipY, caption.subtitle, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#b8b8d0',
        align: 'center',
      })
      .setOrigin(0.5, 0);
    artRoot.add(sub);
    chipY += 20;
  }

  if (caption.chips && caption.chips.length > 0) {
    addCaptionChips(scene, artRoot, caption.chips, chipY, caption.borderColor);
  }
}

function addCaptionChips(
  scene: Phaser.Scene,
  artRoot: Phaser.GameObjects.Container,
  labels: string[],
  y: number,
  accentColor: number,
): void {
  const gap = 8;
  const chipH = 22;
  const chipWidths = labels.map((l) => Math.max(40, l.length * 11 + 18));
  const totalW = chipWidths.reduce((s, cw) => s + cw, 0) + gap * (labels.length - 1);
  let x = -totalW / 2;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]!;
    const chipW = chipWidths[i]!;
    const cx = x + chipW / 2;
    const cy = y + 10;

    const chip = scene.add
      .rectangle(cx, cy, chipW, chipH, 0x14141f, 1)
      .setStrokeStyle(1, accentColor, 0.8);

    const text = scene.add
      .text(cx, cy, label, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    artRoot.add([chip, text]);
    x += chipW + gap;
  }
}
