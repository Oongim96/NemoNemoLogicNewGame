import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { SplashScene } from '@scenes/SplashScene';
import { LoadingScene } from '@scenes/LoadingScene';
import { LoginScene } from '@scenes/LoginScene';
import { HubScene } from '@scenes/HubScene';
import { DifficultySelectScene } from '@scenes/DifficultySelectScene';
import { GachaScene } from '@scenes/GachaScene';
import { CharacterScene } from '@scenes/CharacterScene';
import { CardCollectionScene } from '@scenes/CardCollectionScene';
import { TeamScene } from '@scenes/TeamScene';
import { SettingsScene } from '@scenes/SettingsScene';
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
    scene: [
      BootScene,
      SplashScene,
      LoadingScene,
      LoginScene,
      HubScene,
      DifficultySelectScene,
      GachaScene,
      CharacterScene,
      CardCollectionScene,
      TeamScene,
      SettingsScene,
      MapScene,
      PuzzleScene,
      RunCompleteScene,
    ],
  };

  return new Phaser.Game(config);
}
