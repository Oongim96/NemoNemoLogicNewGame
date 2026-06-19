import Phaser from 'phaser';
import { cardRepository } from '@modules/card';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // 픽셀 스프라이트·BGM은 이후 public/assets/ 에 추가
  }

  create(): void {
    const stats = cardRepository.getStats();
    this.registry.set('dataStats', stats);
    this.scene.start('MainMenuScene');
  }
}
