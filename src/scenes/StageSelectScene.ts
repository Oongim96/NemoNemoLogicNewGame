import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '@app/game.config';
import { PICTURE_STAGES, type PictureStage, type PlayerProfile } from '@modules/meta';
import { RunState } from '@modules/run';
import { drawSubScreenHeader, fillMobileBackground } from '@ui/mobile-shell';

const CARD_H = 88;
const CARD_GAP = 10;
const CARD_W = GAME_WIDTH - 32;
const ICON_X = 48;
const TEXT_X = 96;

function stageMetaLine(stage: PictureStage): string {
  return `${stage.mapSize}×${stage.mapSize} 구역 · ${stage.pictureSize}×${stage.pictureSize} · 퍼즐 ${stage.puzzleSize}×${stage.puzzleSize}`;
}

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelectScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;

    fillMobileBackground(this);
    const contentTop = drawSubScreenHeader(this, '그림 선택', () => this.scene.start('HubScene'));

    this.add
      .text(GAME_WIDTH / 2, contentTop + 6, '큰 그림을 고르면 정해진 난이도로 시작', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8888aa',
      })
      .setOrigin(0.5, 0);

    let y = contentTop + 32 + CARD_H / 2;
    for (const stage of PICTURE_STAGES) {
      this.drawStageCard(stage, y, profile);
      y += CARD_H + CARD_GAP;
    }
  }

  private drawStageCard(stage: PictureStage, y: number, profile: PlayerProfile): void {
    const card = this.add
      .rectangle(GAME_WIDTH / 2, y, CARD_W, CARD_H, stage.bgColor)
      .setStrokeStyle(2, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    this.add
      .rectangle(ICON_X, y, 64, 64, 0x000000, 0.25)
      .setStrokeStyle(1, 0xffffff, 0.15);

    this.add.text(ICON_X, y, stage.icon, { fontSize: '36px' }).setOrigin(0.5);

    this.add
      .text(TEXT_X, y - 22, stage.title, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(TEXT_X, y + 2, stage.subtitle, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#7c5cff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(TEXT_X, y + 24, stageMetaLine(stage), {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8888aa',
      })
      .setOrigin(0, 0.5);

    card.on('pointerover', () => card.setFillStyle(stage.bgColor, 1).setAlpha(0.92));
    card.on('pointerout', () => card.setAlpha(1));
    card.on('pointerdown', () => {
      this.registry.set('currentPicture', stage);
      this.registry.set(
        'runState',
        RunState.createFresh({ mapSize: stage.mapSize, party: profile.getPartyConfig() }),
      );
      this.scene.start('MapScene');
    });
  }
}
