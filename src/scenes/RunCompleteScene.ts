import Phaser from 'phaser';
import { SECTION_COUNT, SECTION_PUZZLES } from '@modules/puzzle';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import type { RunState } from '@modules/run';

export class RunCompleteScene extends Phaser.Scene {
  constructor() {
    super('RunCompleteScene');
  }

  create(): void {
    const run = this.registry.get('runState') as RunState;
    const { gold, mistakes } = run.getProgress();

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 100, '큰 그림 완성!', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 160, '고대 용의 실루엣이 모두 밝혀졌습니다', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    this.drawFullPicture(GAME_WIDTH / 2, 300);

    this.add
      .text(
        GAME_WIDTH / 2,
        470,
        `구역 ${SECTION_COUNT}/${SECTION_COUNT} · 골드 ${gold} · 실수 ${mistakes}`,
        {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#8888aa',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 500, '다음 단계: 자동 전투 1회 (추후 연동)', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#555566',
      })
      .setOrigin(0.5);

    const menuBtn = this.add
      .rectangle(GAME_WIDTH / 2, 560, 200, 44, COLORS.accent)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, 560, '메뉴로', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  private drawFullPicture(cx: number, cy: number): void {
    const run = this.registry.get('runState') as RunState;
    const tile = 36;
    const gap = 2;
    const mapSize = run.mapSize;
    const total = mapSize * tile + (mapSize - 1) * gap;
    const originX = cx - total / 2 + tile / 2;
    const originY = cy - total / 2 + tile / 2;

    for (let row = 0; row < mapSize; row++) {
      for (let col = 0; col < mapSize; col++) {
        const idx = row * mapSize + col;
        const puzzle = SECTION_PUZZLES[idx];
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
