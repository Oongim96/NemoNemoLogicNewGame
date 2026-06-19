import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config';

type CellState = 'empty' | 'fill' | 'mark';

/** 5×5 데모 퍼즐 — 이후 구역·큰 그림 시스템으로 확장 */
const DEMO_SOLUTION = [
  [1, 1, 0, 1, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 0, 1],
  [0, 0, 0, 1, 0],
];

const CELL = 48;
const GRID = DEMO_SOLUTION.length;

export class PuzzleScene extends Phaser.Scene {
  private grid: CellState[][] = [];
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('PuzzleScene');
  }

  create(): void {
    this.grid = Array.from({ length: GRID }, () =>
      Array.from({ length: GRID }, () => 'empty' as CellState),
    );
    this.cellRects = [];

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 36, '데모 구역 (5×5)', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);

    this.statusText = this.add.text(GAME_WIDTH / 2, 72, '칸을 클릭해 채우기 / 우클릭으로 X', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#8888aa',
    }).setOrigin(0.5);

    const offsetX = (GAME_WIDTH - GRID * CELL) / 2;
    const offsetY = (GAME_HEIGHT - GRID * CELL) / 2 + 20;

    for (let y = 0; y < GRID; y++) {
      const row: Phaser.GameObjects.Rectangle[] = [];
      for (let x = 0; x < GRID; x++) {
        const rect = this.add
          .rectangle(offsetX + x * CELL + CELL / 2, offsetY + y * CELL + CELL / 2, CELL - 4, CELL - 4, COLORS.cellEmpty)
          .setStrokeStyle(2, 0x3a3a50)
          .setInteractive({ useHandCursor: true });

        rect.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.onCellClick(x, y, pointer.rightButtonDown());
        });

        row.push(rect);
      }
      this.cellRects.push(row);
    }

    const backBtn = this.add
      .text(24, GAME_HEIGHT - 32, '← 메뉴', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#7c5cff',
      })
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
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
    this.checkCell(x, y);
  }

  private refreshCell(x: number, y: number): void {
    const state = this.grid[y][x];
    const rect = this.cellRects[y][x];
    if (state === 'fill') {
      rect.setFillStyle(COLORS.cellFill);
    } else if (state === 'mark') {
      rect.setFillStyle(COLORS.cellMark);
    } else {
      rect.setFillStyle(COLORS.cellEmpty);
    }
  }

  private checkCell(x: number, y: number): void {
    const expected = DEMO_SOLUTION[y][x] === 1;
    const actual = this.grid[y][x] === 'fill';

    if (this.grid[y][x] === 'empty' || this.grid[y][x] === 'mark') {
      if (expected && this.grid[y][x] === 'mark') {
        this.flashCell(x, y, COLORS.cellWrong);
        this.statusText.setText('오답 — X 표시한 칸이 채워져야 합니다');
      } else {
        this.statusText.setText('칸을 클릭해 채우기 / 우클릭으로 X');
      }
      return;
    }

    if (expected === actual) {
      this.flashCell(x, y, COLORS.cellCorrect);
      this.statusText.setText(`정답! (${x + 1}, ${y + 1}) — 이후 여기서 3택1 드래프트`);
    } else {
      this.flashCell(x, y, COLORS.cellWrong);
      this.statusText.setText('오답 — 실수 페널티 (추후 연동)');
    }

    if (this.isPuzzleComplete()) {
      this.time.delayedCall(400, () => {
        this.statusText.setText('구역 완료! (다음: 맵·드래프트·덱 연동)');
      });
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

  private isPuzzleComplete(): boolean {
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const shouldFill = DEMO_SOLUTION[y][x] === 1;
        const isFill = this.grid[y][x] === 'fill';
        if (shouldFill !== isFill) return false;
      }
    }
    return true;
  }
}
