import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { MainMenuScene } from '@scenes/MainMenuScene';
import { MapScene } from '@scenes/MapScene';
import { PuzzleScene } from '@scenes/PuzzleScene';
import { RunCompleteScene } from '@scenes/RunCompleteScene';
import { GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';

export function createGame(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0d0d14',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MainMenuScene, MapScene, PuzzleScene, RunCompleteScene],
  };

  return new Phaser.Game(config);
}
