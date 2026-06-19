import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';

export function fillBackground(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);
}

export function drawHeader(
  scene: Phaser.Scene,
  title: string,
  subtitle?: string,
): { titleText: Phaser.GameObjects.Text; subtitleText?: Phaser.GameObjects.Text } {
  const titleText = scene.add
    .text(GAME_WIDTH / 2, 36, title, {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#f0f0f5',
    })
    .setOrigin(0.5);

  if (!subtitle) return { titleText };

  const subtitleText = scene.add
    .text(GAME_WIDTH / 2, 68, subtitle, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#8888aa',
    })
    .setOrigin(0.5);

  return { titleText, subtitleText };
}

export interface WireButtonResult {
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export function wireButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  onClick: () => void,
  color = COLORS.accent,
): WireButtonResult {
  const rect = scene.add
    .rectangle(x, y, width, height, color)
    .setInteractive({ useHandCursor: true });

  const label = scene.add
    .text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    })
    .setOrigin(0.5);

  rect.on('pointerover', () => rect.setFillStyle(0x9b7fff));
  rect.on('pointerout', () => rect.setFillStyle(color));
  rect.on('pointerdown', onClick);

  return { rect, label };
}

export function wirePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, width, height, COLORS.panel).setStrokeStyle(2, COLORS.accent);
}

export function backToHub(scene: Phaser.Scene, y = GAME_HEIGHT - 40): void {
  const link = scene.add
    .text(24, y, '← 허브', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#7c5cff',
    })
    .setInteractive({ useHandCursor: true });

  link.on('pointerdown', () => scene.scene.start('HubScene'));
}

export function getPlayerProfile(scene: Phaser.Scene) {
  return scene.registry.get('playerProfile');
}
