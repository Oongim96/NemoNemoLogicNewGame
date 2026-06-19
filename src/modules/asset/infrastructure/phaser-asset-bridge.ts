import type Phaser from 'phaser';
import type { AssetEntry } from '@modules/asset/domain/asset.types';
import { AssetLocator } from '@modules/asset/infrastructure/asset-locator';

export function queueAssetEntry(scene: Phaser.Scene, entry: AssetEntry, locator: AssetLocator): void {
  const url = locator.resolve(entry);

  switch (entry.kind) {
    case 'image':
      scene.load.image(entry.key, url);
      break;
    case 'audio':
      scene.load.audio(entry.key, url);
      break;
    case 'json':
      scene.load.json(entry.key, url);
      break;
    case 'spritesheet':
      if (entry.frameConfig) {
        scene.load.spritesheet(entry.key, url, entry.frameConfig);
      }
      break;
    case 'atlas':
      scene.load.atlas(entry.key, url.replace(/\.json$/, '.png'), url);
      break;
    case 'bitmapFont':
      scene.load.bitmapFont(entry.key, url.replace(/\.xml$/, '.png'), url);
      break;
  }
}

export function queueEntries(
  scene: Phaser.Scene,
  entries: AssetEntry[],
  locator: AssetLocator,
): void {
  for (const entry of entries) {
    queueAssetEntry(scene, entry, locator);
  }
}

/** Phaser load.complete Promise 래퍼 */
export function runLoader(scene: Phaser.Scene): Promise<void> {
  return new Promise((resolve, reject) => {
    scene.load.once('complete', () => resolve());
    scene.load.once('loaderror', (_file: Phaser.Loader.File) => {
      reject(new Error('Asset load failed'));
    });
    scene.load.start();
  });
}
