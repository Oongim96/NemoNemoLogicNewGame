import Phaser from 'phaser';
import { dataRegistry } from '../systems/DataRegistry';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // 픽셀 스프라이트·BGM은 이후 public/assets/ 에 추가
  }

  create(): void {
    const stats = dataRegistry.getStats();
    this.registry.set('dataStats', stats);
    this.scene.start('MainMenuScene');
  }
}
