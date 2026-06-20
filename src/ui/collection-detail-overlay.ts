import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { drawDetailArt, addDetailArtCaption, getDetailArtCaptionBottom, type DetailArtOptions } from '@ui/collection-detail-art';

export interface DetailSection {
  title: string;
  body: string;
  muted?: boolean;
}

export interface CollectionDetailOptions {
  art: DetailArtOptions;
  title: string;
  subtitle?: string;
  chips?: string[];
  borderColor?: number;
  sections: DetailSection[];
  footerLabel?: string;
  footerDisabled?: boolean;
  onFooter?: () => void;
}

const PANEL_W = GAME_WIDTH - 24;
const CLOSE_SIZE = 40;

export class CollectionDetailOverlay {
  private container: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private onClose: () => void,
  ) {
    this.container = scene.add.container(0, 0).setDepth(200);
  }

  show(options: CollectionDetailOptions): void {
    const borderColor = options.borderColor ?? options.art.borderColor ?? COLORS.accent;
    const panelTop = LAYOUT.CONTENT_TOP + 6;
    const panelBottom = LAYOUT.CONTENT_BOTTOM - 6;
    const panelH = panelBottom - panelTop;
    const panelY = panelTop + panelH / 2;
    const hasFooter = Boolean(options.footerLabel && options.onFooter);

    const dim = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setInteractive();
    dim.on('pointerdown', () => this.close());

    const panel = this.scene.add
      .rectangle(GAME_WIDTH / 2, panelY, PANEL_W, panelH, 0x12121c)
      .setStrokeStyle(2, borderColor);

    this.container.add([dim, panel]);

    const artW = PANEL_W - 20;
    const artH = Math.min(196, panelH * 0.32);
    const artTop = panelTop + 14;
    const artY = artTop + artH / 2;

    const captionBottom = getDetailArtCaptionBottom(artH, options.subtitle, options.chips);
    const dividerY = artY + captionBottom + 10;

    const divider = this.scene.add.rectangle(GAME_WIDTH / 2, dividerY, PANEL_W - 32, 1, 0x3a3a55);
    this.container.add(divider);

    const artRoot = drawDetailArt(this.scene, GAME_WIDTH / 2, artY, artW, artH, options.art);
    addDetailArtCaption(this.scene, artRoot, artW, artH, {
      title: options.title,
      subtitle: options.subtitle,
      chips: options.chips,
      borderColor,
    });
    this.container.add(artRoot);

    let y = dividerY + 14;
    const contentBottom = hasFooter ? panelBottom - 52 : panelBottom - 12;

    for (const section of options.sections) {
      if (y > contentBottom - 40) break;

      const sectionTitle = this.scene.add
        .text(34, y + 10, section.title, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: section.muted ? '#777788' : '#f0f0f5',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);

      const body = this.scene.add
        .text(34, y + 32, section.body, {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: section.muted ? '#555566' : '#aaaacc',
          wordWrap: { width: PANEL_W - 68 },
          lineSpacing: 5,
        })
        .setOrigin(0, 0);

      const boxH = Math.max(56, body.height + 42);
      if (y + boxH > contentBottom) {
        body.destroy();
        sectionTitle.destroy();
        break;
      }

      const boxY = y + boxH / 2;
      const box = this.scene.add
        .rectangle(GAME_WIDTH / 2, boxY, PANEL_W - 28, boxH, section.muted ? 0x14141f : 0x1a1a2e)
        .setStrokeStyle(1, section.muted ? 0x2a2a3a : borderColor, section.muted ? 0.4 : 0.35);

      const accent = this.scene.add.rectangle(24, y + 12, 3, 14, section.muted ? 0x555566 : borderColor);
      accent.setOrigin(0, 0);

      this.container.add([box, accent, sectionTitle, body]);
      y += boxH + 10;
    }

    if (hasFooter) {
      const btn = this.scene.add
        .rectangle(
          GAME_WIDTH / 2,
          panelBottom - 28,
          PANEL_W - 32,
          42,
          options.footerDisabled ? 0x32324a : COLORS.accent,
        )
        .setInteractive({ useHandCursor: !options.footerDisabled });

      const label = this.scene.add
        .text(GAME_WIDTH / 2, panelBottom - 28, options.footerLabel!, {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: options.footerDisabled ? '#8888aa' : '#fff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      if (!options.footerDisabled) {
        btn.on('pointerdown', () => {
          options.onFooter!();
          this.close();
        });
        btn.on('pointerover', () => btn.setFillStyle(0x9b8aff));
        btn.on('pointerout', () => btn.setFillStyle(COLORS.accent));
      }

      this.container.add([btn, label]);
    }

    this.container.bringToTop(artRoot);
    this.addCloseButton(panelTop, borderColor);
  }

  private addCloseButton(panelTop: number, borderColor: number): void {
    const cx = GAME_WIDTH - 20;
    const cy = panelTop + 22;

    const hit = this.scene.add
      .rectangle(cx, cy, CLOSE_SIZE + 8, CLOSE_SIZE + 8, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const bg = this.scene.add
      .circle(cx, cy, CLOSE_SIZE / 2, 0x1e1e2e)
      .setStrokeStyle(2, borderColor);

    const icon = this.scene.add
      .text(cx, cy, '✕', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const close = () => this.close();
    hit.on('pointerdown', close);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', close);
    icon.setInteractive({ useHandCursor: true });
    icon.on('pointerdown', close);

    hit.on('pointerover', () => bg.setFillStyle(0x32324a));
    hit.on('pointerout', () => bg.setFillStyle(0x1e1e2e));

    this.container.add([hit, bg, icon]);
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private close(): void {
    this.destroy();
    this.onClose();
  }
}

export const GRADE_BORDER: Record<string, number> = {
  SSR: 0xffd700,
  SR: 0x9b8aff,
  epic: 0xffb347,
  rare: 0x7c5cff,
  common: 0xaaaaaa,
};

export const CARD_GRADE_KO: Record<string, string> = {
  common: '일반',
  rare: '희귀',
  epic: '에픽',
};

export { BATTLE_TYPE_KO, PUZZLE_TRIGGER_KO } from '@modules/card';
