import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import {
  createEmptyGrid,
  getColClues,
  getRowClues,
  getSectionPuzzle,
  isCellCorrect,
  isSolutionComplete,
  type CellState,
} from '@modules/puzzle';
import { REWARD_LABELS } from '@modules/reward';
import type { RunState } from '@modules/run';
import { RewardOverlay } from '@ui/RewardOverlay';

function puzzleCellSize(gridSize: number): { cell: number; clueW: number; clueH: number } {
  const clueW = 26;
  const clueH = 26;
  const maxBoard = GAME_WIDTH - 40;
  const cell = Math.min(52, Math.floor((maxBoard - clueW) / gridSize));
  return { cell, clueW, clueH };
}

export class PuzzleScene extends Phaser.Scene {
  private sectionIndex = 0;
  private solution: number[][] = [];
  private grid: CellState[][] = [];
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];
  private statusText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private finished = false;
  private inputLocked = false;
  private rewardOverlay: RewardOverlay | null = null;

  constructor() {
    super('PuzzleScene');
  }

  init(data: { sectionIndex: number }): void {
    this.sectionIndex = data.sectionIndex;
    this.solution = getSectionPuzzle(this.sectionIndex).solution;
    this.finished = false;
    this.inputLocked = false;
    this.rewardOverlay = null;
  }

  create(): void {
    const puzzle = getSectionPuzzle(this.sectionIndex);
    const run = this.getRun();
    const size = this.solution.length;
    const { cell: CELL, clueW: CLUE_ROW_W } = puzzleCellSize(size);

    this.grid = createEmptyGrid(size);
    this.cellRects = [];

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 36, `구역 ${this.sectionIndex + 1} · ${puzzle.label}`, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.hudText = this.add
      .text(GAME_WIDTH / 2, 58, this.formatHud(run), {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 78, '탭: 채우기 · 길게/우클릭: X', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    const boardW = size * CELL;
    const boardH = size * CELL;
    const boardX = (GAME_WIDTH - boardW) / 2 + CLUE_ROW_W;
    const boardY = (GAME_HEIGHT - boardH) / 2 + 20;

    this.drawClues(boardX, boardY, size, CELL);

    for (let y = 0; y < size; y++) {
      const row: Phaser.GameObjects.Rectangle[] = [];
      for (let x = 0; x < size; x++) {
        const rect = this.add
          .rectangle(
            boardX + x * CELL + CELL / 2,
            boardY + y * CELL + CELL / 2,
            CELL - 4,
            CELL - 4,
            COLORS.cellEmpty,
          )
          .setStrokeStyle(2, 0x3a3a50)
          .setInteractive({ useHandCursor: true });

        rect.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (this.finished || this.inputLocked) return;
          this.onCellClick(x, y, pointer.rightButtonDown());
        });

        row.push(rect);
      }
      this.cellRects.push(row);
    }

    this.add
      .text(24, GAME_HEIGHT - 32, '← 맵', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#7c5cff',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (!this.inputLocked) this.scene.start('MapScene');
      });
  }

  private formatHud(run: RunState): string {
    const { gold } = run.getProgress();
    return `🪙${gold} · 덱${run.getDeck().size} · HP${run.getHp()}`;
  }

  private refreshHud(): void {
    this.hudText.setText(this.formatHud(this.getRun()));
  }

  private drawClues(boardX: number, boardY: number, size: number, cell: number): void {
    const rowClues = getRowClues(this.solution);
    const colClues = getColClues(this.solution);

    for (let y = 0; y < size; y++) {
      this.add
        .text(boardX - 8, boardY + y * cell + cell / 2, rowClues[y].join(' '), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#8888aa',
        })
        .setOrigin(1, 0.5);
    }

    for (let x = 0; x < size; x++) {
      this.add
        .text(boardX + x * cell + cell / 2, boardY - 8, colClues[x].join('\n'), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#8888aa',
          align: 'center',
        })
        .setOrigin(0.5, 1);
    }
  }

  private onCellClick(x: number, y: number, isRight: boolean): void {
    const next: CellState = isRight
      ? this.grid[y][x] === 'mark'
        ? 'empty'
        : 'mark'
      : this.grid[y][x] === 'fill'
        ? 'empty'
        : 'fill';

    this.grid[y][x] = next;
    this.refreshCell(x, y);
    this.evaluateCell(x, y);
  }

  private refreshCell(x: number, y: number): void {
    const state = this.grid[y][x];
    const rect = this.cellRects[y][x];
    if (state === 'fill') rect.setFillStyle(COLORS.cellFill);
    else if (state === 'mark') rect.setFillStyle(COLORS.cellMark);
    else rect.setFillStyle(COLORS.cellEmpty);
  }

  private evaluateCell(x: number, y: number): void {
    const result = isCellCorrect(this.solution, this.grid, x, y);

    if (result === null) {
      this.statusText.setText('좌클릭: 채우기 · 우클릭: X · 구역 완료 시 보상');
      return;
    }

    if (!result) {
      this.flashCell(x, y, COLORS.cellWrong);
      this.getRun().addMistake();
      this.refreshHud();
      this.statusText.setText('오답 — 실수 +1');
      return;
    }

    this.flashCell(x, y, COLORS.cellCorrect);
    this.statusText.setText('정답!');

    if (isSolutionComplete(this.solution, this.grid)) {
      this.onPuzzleComplete();
    }
  }

  private onPuzzleComplete(): void {
    if (this.finished || this.inputLocked) return;
    this.finished = true;
    this.inputLocked = true;

    const run = this.getRun();
    const puzzle = getSectionPuzzle(this.sectionIndex);
    run.completeSection(this.sectionIndex);
    this.refreshHud();

    const reward = run.resolveSectionReward(this.sectionIndex);
    this.statusText.setText(`구역 완료! — ${REWARD_LABELS[reward.type]}`);

    this.rewardOverlay = new RewardOverlay(this, () => {
      this.rewardOverlay?.destroy();
      this.rewardOverlay = null;
      this.goToMap();
    });

    this.rewardOverlay.show(reward, run, {
      sectionTitle: '구역 완료!',
      sectionSubtitle: `${puzzle.label} · 큰 그림 조각 밝힘 · ${REWARD_LABELS[reward.type]}`,
    });
  }

  private goToMap(): void {
    const run = this.getRun();
    if (run.isRunComplete()) {
      this.scene.start('RunCompleteScene');
    } else {
      this.scene.start('MapScene', { justCompleted: this.sectionIndex });
    }
  }

  private flashCell(x: number, y: number, color: number): void {
    const rect = this.cellRects[y][x];
    const prev = this.grid[y][x];
    rect.setFillStyle(color);
    this.time.delayedCall(200, () => {
      if (prev === 'fill') rect.setFillStyle(COLORS.cellFill);
      else if (prev === 'mark') rect.setFillStyle(COLORS.cellMark);
      else rect.setFillStyle(COLORS.cellEmpty);
    });
  }

  private getRun(): RunState {
    return this.registry.get('runState') as RunState;
  }
}
