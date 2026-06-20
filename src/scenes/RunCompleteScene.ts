import Phaser from 'phaser';
import { getPuzzleSet } from '@modules/puzzle';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import type { RunState } from '@modules/run';

export class RunCompleteScene extends Phaser.Scene {
  constructor() {
    super('RunCompleteScene');
  }

  create(): void {
    const run = this.registry.get('runState') as RunState;
    const { gold, mistakes } = run.getProgress();
    const sectionCount = run.sectionCount;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 80, '큰 그림 완성!', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 116, '고대 용의 실루엣이 모두 밝혀졌습니다', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    this.drawFullPicture(GAME_WIDTH / 2, 280);

    this.add
      .text(
        GAME_WIDTH / 2,
        420,
        `구역 ${sectionCount}/${sectionCount} · 골드 ${gold} · 실수 ${mistakes}`,
        {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#8888aa',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 448, '잠시 후 자동 전투…', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#555566',
      })
      .setOrigin(0.5);

    this.time.delayedCall(1800, () => {
      this.scene.start('AutoBattleScene');
    });

    const menuBtn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH - 48, 48, 0x333344)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '전투 스킵 →', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    menuBtn.on('pointerdown', () => this.scene.start('AutoBattleScene'));
  }

  private drawFullPicture(cx: number, cy: number): void {
    const run = this.registry.get('runState') as RunState;
    const picture = this.registry.get('currentPicture') as { puzzleSetId?: string } | undefined;
    const puzzleSet = getPuzzleSet(picture?.puzzleSetId);
    const tile = 36;
    const gap = 2;
    const mapSize = run.mapSize;
    const total = mapSize * tile + (mapSize - 1) * gap;
    const originX = cx - total / 2 + tile / 2;
    const originY = cy - total / 2 + tile / 2;

    for (let row = 0; row < mapSize; row++) {
      for (let col = 0; col < mapSize; col++) {
        const idx = row * mapSize + col;
        const puzzle = puzzleSet.sections[idx];
        if (!puzzle) continue;
        const px = originX + col * (tile + gap);
        const py = originY + row * (tile + gap);
        const cell = tile / puzzle.solution.length;

        for (let y = 0; y < puzzle.solution.length; y++) {
          for (let x = 0; x < puzzle.solution[y].length; x++) {
            if (puzzle.solution[y][x] !== 1) continue;
            this.add.rectangle(
              px - tile / 2 + x * cell + cell / 2,
              py - tile / 2 + y * cell + cell / 2,
              cell - 1,
              cell - 1,
              puzzle.pieceColor,
            );
          }
        }
      }
    }
  }
}
