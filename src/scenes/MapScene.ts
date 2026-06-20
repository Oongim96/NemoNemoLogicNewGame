import Phaser from 'phaser';
import { getSectionPuzzle } from '@modules/puzzle';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import { REWARD_CATEGORY_DISPLAY } from '@modules/reward';
import type { RunState } from '@modules/run';

const MAP_GAP = 6;

function tileSizeForMap(mapSize: number): number {
  const maxW = GAME_WIDTH - 32;
  if (mapSize === 1) return Math.min(300, maxW - 16);
  return Math.floor((maxW - (mapSize - 1) * MAP_GAP) / mapSize);
}

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  init(data: { justCompleted?: number }): void {
    this.registry.set('mapFlashSection', data.justCompleted ?? null);
  }

  create(): void {
    const run = this.getRun();
    const picture = this.registry.get('currentPicture') as { title?: string } | undefined;
    const stageTitle = picture?.title ?? '고대 용의 그림';
    const mapSize = run.mapSize;
    const sectionCount = run.sectionCount;
    const tileSize = tileSizeForMap(mapSize);
    const mapWidth = mapSize * tileSize + (mapSize - 1) * MAP_GAP;
    const mapOriginX = (GAME_WIDTH - mapWidth) / 2;
    const justCompleted = this.registry.get('mapFlashSection') as number | null;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 44, stageTitle, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        72,
        `구역 ${run.completedCount}/${sectionCount} · 🪙${run.getProgress().gold} · 덱 ${run.getDeck().size}`,
        {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#8888aa',
        },
      )
      .setOrigin(0.5);

    const mapHeight = mapSize * tileSize + (mapSize - 1) * MAP_GAP;
    const mapTop = 100 + Math.max(0, (GAME_HEIGHT - 180 - mapHeight) / 2);

    for (let row = 0; row < mapSize; row++) {
      for (let col = 0; col < mapSize; col++) {
        const sectionIndex = row * mapSize + col;
        this.drawSectionTile(
          sectionIndex,
          col,
          row,
          mapTop,
          mapOriginX,
          tileSize,
          run,
          justCompleted === sectionIndex,
        );
      }
    }

    const menuBtn = this.add
      .text(16, GAME_HEIGHT - 36, '← 나가기', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#7c5cff',
      })
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this.scene.start('HubScene'));

    if (run.isRunComplete()) {
      this.time.delayedCall(600, () => this.scene.start('RunCompleteScene'));
    }
  }

  private drawSectionTile(
    sectionIndex: number,
    col: number,
    row: number,
    mapTop: number,
    mapOriginX: number,
    tileSize: number,
    run: RunState,
    flash: boolean,
  ): void {
    const puzzleSetId = this.getPuzzleSetId();
    const puzzle = getSectionPuzzle(sectionIndex, puzzleSetId);
    const x = mapOriginX + col * (tileSize + MAP_GAP) + tileSize / 2;
    const y = mapTop + row * (tileSize + MAP_GAP) + tileSize / 2;
    const completed = run.getSectionStatus(sectionIndex) === 'completed';

    const frame = this.add
      .rectangle(x, y, tileSize, tileSize, completed ? 0x2a2a40 : 0x14141f)
      .setStrokeStyle(2, completed ? puzzle.pieceColor : 0x3a3a50);

    if (completed) {
      this.drawPiecePixels(x, y, puzzle.solution, puzzle.pieceColor, tileSize);
    } else {
      const overlay = this.add.rectangle(x, y, tileSize - 8, tileSize - 8, 0x0a0a12, 0.85);
      const display = REWARD_CATEGORY_DISPLAY[run.getSectionCategory(sectionIndex)];

      this.add
        .text(x, y - tileSize * 0.33, `구역 ${sectionIndex + 1}`, {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#666680',
        })
        .setOrigin(0.5);

      this.add.text(x, y - 4, display.icon, { fontSize: tileSize >= 120 ? '40px' : '28px' }).setOrigin(0.5);

      this.add
        .text(x, y + tileSize * 0.22, display.shortLabel, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: display.color,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.add
        .text(x, y + tileSize * 0.38, puzzle.label, {
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
    tileSize: number,
  ): void {
    const size = solution.length;
    const pixel = (tileSize - 24) / size;
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

  private getPuzzleSetId(): string {
    const picture = this.registry.get('currentPicture') as { puzzleSetId?: string } | undefined;
    return picture?.puzzleSetId ?? 'dragon_3x3';
  }

  private getRun(): RunState {
    return this.registry.get('runState') as RunState;
  }
}
