import Phaser from 'phaser';
import { cardRepository } from '@modules/card';
import { getAssetLoader } from '@modules/asset';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const stats = cardRepository.getStats();
    this.registry.set('dataStats', stats);
    this.registry.set('assetLoader', getAssetLoader());
    this.scene.start('SplashScene');
  }
}
