import Phaser from 'phaser';
import { MAP_SIZE, SECTION_COUNT, SECTION_PUZZLES } from '@modules/puzzle';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import { REWARD_CATEGORY_DISPLAY } from '@modules/reward';
import type { RunState } from '@modules/run';

const MAP_TILE = 140;
const MAP_GAP = 6;
const MAP_ORIGIN_X = (GAME_WIDTH - (MAP_SIZE * MAP_TILE + (MAP_SIZE - 1) * MAP_GAP)) / 2;

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  init(data: { justCompleted?: number }): void {
    this.registry.set('mapFlashSection', data.justCompleted ?? null);
  }

  create(): void {
    const run = this.getRun();
    const justCompleted = this.registry.get('mapFlashSection') as number | null;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 28, '고대 용의 그림', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        58,
        `구역 ${run.completedCount}/${SECTION_COUNT} · 🪙${run.getProgress().gold} · 덱 ${run.getDeck().size}장`,
        {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#8888aa',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 82, '구역 중앙 아이콘 = 클리어 보상 · 선택해서 퍼즐 시작', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    const mapTop = 110;
    for (let row = 0; row < MAP_SIZE; row++) {
      for (let col = 0; col < MAP_SIZE; col++) {
        const sectionIndex = row * MAP_SIZE + col;
        this.drawSectionTile(sectionIndex, col, row, mapTop, run, justCompleted === sectionIndex);
      }
    }

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 72, '좌클릭: 채우기 · 우클릭: X (퍼즐 중)', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#555566',
      })
      .setOrigin(0.5);

    const menuBtn = this.add
      .text(24, GAME_HEIGHT - 32, '← 메뉴', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#7c5cff',
      })
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    if (run.isRunComplete()) {
      this.time.delayedCall(600, () => this.scene.start('RunCompleteScene'));
    }
  }

  private drawSectionTile(
    sectionIndex: number,
    col: number,
    row: number,
    mapTop: number,
    run: RunState,
    flash: boolean,
  ): void {
    const puzzle = SECTION_PUZZLES[sectionIndex];
    const x = MAP_ORIGIN_X + col * (MAP_TILE + MAP_GAP) + MAP_TILE / 2;
    const y = mapTop + row * (MAP_TILE + MAP_GAP) + MAP_TILE / 2;
    const completed = run.getSectionStatus(sectionIndex) === 'completed';

    const frame = this.add
      .rectangle(x, y, MAP_TILE, MAP_TILE, completed ? 0x2a2a40 : 0x14141f)
      .setStrokeStyle(2, completed ? puzzle.pieceColor : 0x3a3a50);

    if (completed) {
      this.drawPiecePixels(x, y, puzzle.solution, puzzle.pieceColor);
    } else {
      const overlay = this.add.rectangle(x, y, MAP_TILE - 8, MAP_TILE - 8, 0x0a0a12, 0.85);
      const display = REWARD_CATEGORY_DISPLAY[run.getSectionCategory(sectionIndex)];

      this.add
        .text(x, y - 46, `구역 ${sectionIndex + 1}`, {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#666680',
        })
        .setOrigin(0.5);

      this.add.text(x, y - 4, display.icon, { fontSize: '40px' }).setOrigin(0.5);

      this.add
        .text(x, y + 30, display.shortLabel, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: display.color,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.add
        .text(x, y + 52, puzzle.label, {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: '#555566',
        })
        .setOrigin(0.5);

      frame.setInteractive({ useHandCursor: true });
      frame.on('pointerover', () => frame.setStrokeStyle(2, COLORS.accent));
      frame.on('pointerout', () => frame.setStrokeStyle(2, 0x3a3a50));
      frame.on('pointerdown', () => {
        this.scene.start('PuzzleScene', { sectionIndex });
      });

      if (flash) {
        this.tweens.add({
          targets: overlay,
          alpha: 0.2,
          duration: 300,
          yoyo: true,
          repeat: 2,
        });
      }
    }
  }

  private drawPiecePixels(
    centerX: number,
    centerY: number,
    solution: number[][],
    color: number,
  ): void {
    const size = solution.length;
    const pixel = (MAP_TILE - 24) / size;
    const originX = centerX - ((size * pixel) / 2) + pixel / 2;
    const originY = centerY - ((size * pixel) / 2) + pixel / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (solution[y][x] !== 1) continue;
        this.add.rectangle(
          originX + x * pixel,
          originY + y * pixel,
          pixel - 2,
          pixel - 2,
          color,
        );
      }
    }
  }

  private getRun(): RunState {
    return this.registry.get('runState') as RunState;
  }
}
