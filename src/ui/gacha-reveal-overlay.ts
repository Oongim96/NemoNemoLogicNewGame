import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import type { GachaRevealFace, GachaRevealTile } from '@modules/gacha/domain/gacha-reveal.builder';

/** 1회 소환 기준 카드 크기 · 비율 유지용 */
const REF_CARD_W = 158;
const REF_CARD_H = 228;
const CARD_RATIO = REF_CARD_W / REF_CARD_H;

interface TileLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TileView {
  container: Phaser.GameObjects.Container;
  backParts: Phaser.GameObjects.GameObject[];
  backMain: Phaser.GameObjects.Rectangle;
  hitZone: Phaser.GameObjects.Rectangle;
  front: Phaser.GameObjects.Container;
  revealed: boolean;
  data: GachaRevealTile;
  borderColor: number;
  backFill: number;
}

export class GachaRevealOverlay {
  private container: Phaser.GameObjects.Container;
  private hintText!: Phaser.GameObjects.Text;
  private footerBtn: Phaser.GameObjects.Rectangle | null = null;
  private tiles: TileView[] = [];
  private flipping = false;
  private closed = false;

  constructor(
    private scene: Phaser.Scene,
    private onClose: () => void,
  ) {
    this.container = scene.add.container(0, 0).setDepth(300);
  }

  show(tiles: GachaRevealTile[], title: string): void {
    const dim = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82)
      .setInteractive();

    const titleText = this.scene.add
      .text(GAME_WIDTH / 2, 72, title, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.hintText = this.scene.add
      .text(GAME_WIDTH / 2, 102, '카드를 눌러 하나씩 확인', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.container.add([dim, titleText, this.hintText]);

    const layouts = this.computeLayouts(tiles.length);
    tiles.forEach((tile, i) => {
      const layout = layouts[i]!;
      this.tiles.push(this.createTile(tile, layout));
    });

    if (tiles.length > 1) {
      this.addRevealAllButton();
    }
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private revealArea() {
    return { padX: 16, top: 118, bottom: GAME_HEIGHT - 96 };
  }

  /** 1회·10회 동일 카드 비율(세로형) */
  private computeLayouts(count: number): TileLayout[] {
    const { padX, top, bottom } = this.revealArea();
    const areaH = bottom - top;
    const areaW = GAME_WIDTH - padX * 2;

    if (count === 1) {
      const w = Math.min(REF_CARD_W, areaW);
      const h = w / CARD_RATIO;
      return [{ x: GAME_WIDTH / 2, y: top + areaH / 2, w, h }];
    }

    if (count === 2) {
      const gap = 14;
      const w = Math.min(REF_CARD_W, (areaW - gap) / 2);
      const h = w / CARD_RATIO;
      const totalW = w * 2 + gap;
      const startX = (GAME_WIDTH - totalW) / 2 + w / 2;
      const y = top + areaH / 2;
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
    let h = w / CARD_RATIO;
    if (h > maxH) {
      h = maxH;
      w = h * CARD_RATIO;
    }

    const gridW = cols * w + gapX;
    const gridH = rows * h + gapY * (rows - 1);
    const startX = (GAME_WIDTH - gridW) / 2 + w / 2;
    const startY = top + (areaH - gridH) / 2 + h / 2;

    return Array.from({ length: count }, (_, i) => ({
      x: startX + (i % cols) * (w + gapX),
      y: startY + Math.floor(i / cols) * (h + gapY),
      w,
      h,
    }));
  }

  private createTile(data: GachaRevealTile, layout: TileLayout): TileView {
    const face = data.faces[0]!;
    const borderColor = face.borderColor;
    const scale = layout.w / REF_CARD_W;
    const stroke = Math.max(3, Math.round(4 * scale));
    const backFill = this.blendColor(borderColor, 0x14141f, 0.32);

    const container = this.scene.add.container(layout.x, layout.y);

    const back = this.scene.add
      .rectangle(0, 0, layout.w, layout.h, backFill)
      .setStrokeStyle(stroke, borderColor);

    const gradeBarH = Math.max(16, Math.round(24 * scale));
    const backGradeBar = this.scene.add
      .rectangle(0, -layout.h / 2 + gradeBarH / 2 + 4, layout.w - stroke * 2, gradeBarH, borderColor, 0.35)
      .setStrokeStyle(0);

    const backInner = this.scene.add
      .rectangle(0, 0, layout.w - 10, layout.h - 10, this.blendColor(borderColor, 0x0d0d14, 0.2))
      .setStrokeStyle(Math.max(1, Math.round(2 * scale)), borderColor, 0.55);

    const glowColor = this.colorHex(borderColor);
    const backGlow = this.scene.add
      .text(0, -layout.h * 0.06, '✦', {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(28 * scale)}px`,
        color: glowColor,
      })
      .setOrigin(0.5);

    const backLabel = this.scene.add
      .text(0, layout.h * 0.1, data.pullIndex ? `#${data.pullIndex}` : '?', {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(data.pullIndex ? 14 * scale : 32 * scale)}px`,
        color: glowColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const backParts: Phaser.GameObjects.GameObject[] = [
      back,
      backGradeBar,
      backInner,
      backGlow,
      backLabel,
    ];

    const front = this.scene.add.container(0, 0).setVisible(false);
    front.add(this.buildFrontFace(face, layout.w, layout.h, borderColor));

    const hitZone = this.scene.add
      .rectangle(0, 0, layout.w, layout.h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    container.add([...backParts, front, hitZone]);
    this.container.add(container);

    const view: TileView = {
      container,
      backParts,
      backMain: back,
      hitZone,
      front,
      revealed: false,
      data,
      borderColor,
      backFill,
    };

    hitZone.on('pointerdown', () => this.flipTile(view));
    hitZone.on('pointerover', () => {
      if (!view.revealed) back.setFillStyle(this.blendColor(borderColor, 0x14141f, 0.48));
    });
    hitZone.on('pointerout', () => {
      if (!view.revealed) back.setFillStyle(backFill);
    });

    return view;
  }

  private buildFrontFace(
    face: GachaRevealFace,
    w: number,
    h: number,
    borderColor: number,
  ): Phaser.GameObjects.Container {
    const root = this.scene.add.container(0, 0);
    const scale = w / REF_CARD_W;
    const stroke = Math.max(3, Math.round(4 * scale));

    const bg = this.scene.add.rectangle(0, 0, w, h, 0x1a1a2e).setStrokeStyle(stroke, borderColor);
    root.add(bg);

    const tintH = Math.max(18, Math.round(28 * scale));
    const gradeBar = this.scene.add
      .rectangle(0, -h / 2 + tintH / 2 + 4, w - stroke * 2, tintH, borderColor, 0.22)
      .setStrokeStyle(0);
    root.add(gradeBar);

    const slotLabel = this.scene.add
      .text(-w / 2 + 10, -h / 2 + tintH / 2 + 4, face.slotLabel, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.max(9, Math.round(10 * scale))}px`,
        color: '#ddddee',
      })
      .setOrigin(0, 0.5);

    const icon = this.scene.add
      .text(0, -h * 0.06, face.icon, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.max(18, Math.round(26 * scale))}px`,
        color: '#f0f0f5',
      })
      .setOrigin(0.5);

    const title = this.scene.add
      .text(0, h * 0.06, face.title, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.max(12, Math.round(15 * scale))}px`,
        color: '#f0f0f5',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w - 20 },
      })
      .setOrigin(0.5);

    const detail = this.scene.add
      .text(0, h * 0.2, face.detail, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.max(9, Math.round(10 * scale))}px`,
        color: this.colorHex(borderColor),
        align: 'center',
        wordWrap: { width: w - 16 },
      })
      .setOrigin(0.5);

    root.add([slotLabel, icon, title, detail]);

    if (face.badge) {
      const badge = this.scene.add
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

  private colorHex(n: number): string {
    return `#${n.toString(16).padStart(6, '0')}`;
  }

  private blendColor(color: number, base: number, t: number): number {
    const mix = (c: number, b: number) => Math.round(b + (c - b) * t);
    const r = mix((color >> 16) & 0xff, (base >> 16) & 0xff);
    const g = mix((color >> 8) & 0xff, (base >> 8) & 0xff);
    const b = mix(color & 0xff, base & 0xff);
    return (r << 16) | (g << 8) | b;
  }

  private flipTile(view: TileView): void {
    if (this.closed || view.revealed || this.flipping) return;
    this.flipping = true;

    const isHighlight =
      view.borderColor === 0xffd700 ||
      view.borderColor === 0xffb347 ||
      view.borderColor === 0x9b8aff;

    this.scene.tweens.add({
      targets: view.container,
      scaleX: 0,
      duration: 110,
      ease: 'Quad.easeIn',
      onComplete: () => {
        view.backParts.forEach((obj) => {
          if ('setVisible' in obj && typeof obj.setVisible === 'function') {
            obj.setVisible(false);
          }
        });
        view.front.setVisible(true);
        view.container.setScale(0, 1);
        view.revealed = true;
        view.hitZone.disableInteractive();

        this.scene.tweens.add({
          targets: view.container,
          scaleX: 1,
          duration: 180,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (isHighlight) {
              this.scene.tweens.add({
                targets: view.container,
                scaleX: 1.06,
                scaleY: 1.06,
                duration: 120,
                yoyo: true,
                ease: 'Sine.easeOut',
              });
            }
            this.flipping = false;
            this.refreshHint();
            this.checkAllRevealed();
          },
        });
      },
    });
  }

  private addRevealAllButton(): void {
    const btn = this.scene.add
      .rectangle(GAME_WIDTH - 56, 72, 72, 28, 0x32324a)
      .setStrokeStyle(1, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    const label = this.scene.add
      .text(GAME_WIDTH - 56, 72, '모두 열기', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#ccccee',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => this.revealAllSequential());
    this.container.add([btn, label]);
  }

  private revealAllSequential(): void {
    const next = this.tiles.find((t) => !t.revealed);
    if (!next) return;
    this.flipTile(next);
    if (this.tiles.some((t) => !t.revealed)) {
      this.scene.time.delayedCall(220, () => this.revealAllSequential());
    }
  }

  private refreshHint(): void {
    const remaining = this.tiles.filter((t) => !t.revealed).length;
    if (remaining > 0) {
      this.hintText.setText(`남은 카드 ${remaining}장 · 눌러서 확인`);
    } else {
      this.hintText.setText('소환 완료');
    }
  }

  private checkAllRevealed(): void {
    if (!this.tiles.every((t) => t.revealed) || this.footerBtn) return;

    const btn = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 52, GAME_WIDTH - 48, 46, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    const label = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 52, '확인', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#fff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => this.close());
    btn.on('pointerover', () => btn.setFillStyle(0x9b8aff));
    btn.on('pointerout', () => btn.setFillStyle(COLORS.accent));

    this.footerBtn = btn;
    this.container.add([btn, label]);
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    this.destroy();
    this.onClose();
  }
}
