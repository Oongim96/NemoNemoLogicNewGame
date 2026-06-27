import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import {
  emptyPuzzleResult,
  firePuzzleEffects,
  getCharacterPassives,
  getMistakeHpMultiplier,
  isColResolved,
  isRowResolved,
  mergePuzzleResults,
  PuzzleSession,
  tryCharacterUlt,
  type PuzzleEffectResult,
} from '@modules/effects';
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

function puzzleCellSize(gridSize: number): { cell: number; clueW: number } {
  const clueW = gridSize >= 5 ? 22 : 26;
  const maxBoard = GAME_WIDTH - 36;
  const maxCell = gridSize >= 10 ? 28 : gridSize >= 5 ? 44 : 52;
  const cell = Math.min(maxCell, Math.floor((maxBoard - clueW) / gridSize));
  return { cell, clueW };
}

/** 완료 파도 애니메이션 총 길이 (칸 수와 무관) */
const COMPLETION_TOTAL_MS = 1300;
const COMPLETION_TAIL_MS = 280;
const COMPLETION_PULSE_MAX_MS = 110;
const COMPLETION_PULSE_MIN_MS = 36;
const COMPLETION_STAGGER_MIN_MS = 6;

function completionWaveTiming(cellCount: number): { staggerMs: number; pulseMs: number; tailMs: number } {
  const tailMs = COMPLETION_TAIL_MS;
  if (cellCount <= 0) return { staggerMs: 0, pulseMs: 0, tailMs: 0 };
  if (cellCount === 1) {
    return {
      staggerMs: 0,
      pulseMs: Math.min(COMPLETION_PULSE_MAX_MS, COMPLETION_TOTAL_MS - tailMs),
      tailMs,
    };
  }

  const pulseMs = Math.max(
    COMPLETION_PULSE_MIN_MS,
    Math.min(COMPLETION_PULSE_MAX_MS, Math.floor((COMPLETION_TOTAL_MS - tailMs) / cellCount / 2)),
  );
  const pulseTotal = pulseMs * 2;
  const staggerMs = Math.max(
    COMPLETION_STAGGER_MIN_MS,
    Math.floor((COMPLETION_TOTAL_MS - pulseTotal - tailMs) / (cellCount - 1)),
  );
  return { staggerMs, pulseMs, tailMs };
}

export class PuzzleScene extends Phaser.Scene {
  private sectionIndex = 0;
  private solution: number[][] = [];
  private grid: CellState[][] = [];
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];
  private statusText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private effectText!: Phaser.GameObjects.Text;
  private finished = false;
  private inputLocked = false;
  private flashPending = 0;
  private completionQueued = false;
  private completionOrigin = { x: 0, y: 0 };
  private rewardOverlay: RewardOverlay | null = null;
  private session!: PuzzleSession;
  private sectionMistakes = 0;

  constructor() {
    super('PuzzleScene');
  }

  private getPuzzleSetId(): string {
    const picture = this.registry.get('currentPicture') as { puzzleSetId?: string } | undefined;
    return picture?.puzzleSetId ?? 'dragon_3x3';
  }

  init(data: { sectionIndex: number }): void {
    this.sectionIndex = data.sectionIndex;
    this.solution = getSectionPuzzle(this.sectionIndex, this.getPuzzleSetId()).solution;
    this.finished = false;
    this.inputLocked = false;
    this.flashPending = 0;
    this.completionQueued = false;
    this.rewardOverlay = null;
    this.sectionMistakes = 0;
    this.session = new PuzzleSession(this.solution);
  }

  create(): void {
    const puzzle = getSectionPuzzle(this.sectionIndex, this.getPuzzleSetId());
    const run = this.getRun();
    run.resetSectionUlt();
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

    this.effectText = this.add
      .text(GAME_WIDTH / 2, 96, '', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    const boardW = size * CELL;
    const boardH = size * CELL;
    const boardX = (GAME_WIDTH - boardW) / 2 + CLUE_ROW_W;
    const boardY = (GAME_HEIGHT - boardH) / 2 + 28;

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
          if (this.isInputBlocked()) return;
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
        if (!this.isInputBlocked()) this.scene.start('MapScene');
      });

    this.drawUltButton(run);
    this.applySectionStartEffects(run);
  }

  private applySectionStartEffects(run: RunState): void {
    const fx = firePuzzleEffects({
      deck: run.getDeck(),
      party: run.getParty(),
      trigger: 'on_run_start',
      solution: this.solution,
      grid: this.grid,
      modifiers: run.getPuzzleModifiers(),
      session: this.session,
    });
    this.applyEffectResult(run, fx);
  }

  private drawUltButton(run: RunState): void {
    const charId = run.getParty().members[0]?.id;
    if (!charId) return;
    const passive = getCharacterPassives(charId);
    if (passive?.ultKey !== 'reset_mistakes') return;

    const btn = this.add
      .text(GAME_WIDTH - 24, GAME_HEIGHT - 32, '✨ ult', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#f5c842',
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      if (this.isInputBlocked() || run.getUltUsesThisSection() <= 0) return;
      const ult = tryCharacterUlt(charId, 'reset_mistakes', run.getUltUsesThisSection());
      if (!ult.used) return;
      run.consumeUlt();
      run.refundSectionMistakes(this.sectionMistakes);
      this.sectionMistakes = 0;
      this.session.sectionMistakes = 0;
      this.refreshHud();
      this.showEffect(ult.message);
    });
  }

  private formatHud(run: RunState): string {
    const { gold } = run.getProgress();
    const carry = run.getCarryover();
    return `🪙${gold} · 덱${run.getDeck().size} · HP${run.getHp()} · 잉크시드${carry.inkStackSeed}`;
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

  private isInputBlocked(): boolean {
    return this.finished || this.inputLocked || this.flashPending > 0 || this.completionQueued;
  }

  private evaluateCell(x: number, y: number): void {
    const run = this.getRun();
    const result = isCellCorrect(this.solution, this.grid, x, y);

    if (result === null) {
      this.statusText.setText('좌클릭: 채우기 · 우클릭: X · 카드 효과 발동');
      return;
    }

    this.inputLocked = true;

    if (!result) {
      this.flashCell(x, y, COLORS.cellWrong);
      this.session.onMistake();
      this.sectionMistakes++;
      const charId = run.getParty().members[0]?.id ?? '';
      const mult = getMistakeHpMultiplier(charId);
      run.addMistake(1, mult);

      const fx = firePuzzleEffects({
        deck: run.getDeck(),
        party: run.getParty(),
        trigger: 'on_mistake',
        solution: this.solution,
        grid: this.grid,
        modifiers: run.getPuzzleModifiers(),
        cell: { x, y },
        session: this.session,
      });
      this.applyEffectResult(run, fx);
      this.refreshHud();
      this.statusText.setText(`틀렸어요 — HP ${run.getHp()}/10`);
      this.releaseInputIfIdle();
      return;
    }

    this.flashCell(x, y, COLORS.cellCorrect);
    this.session.onCorrectPlacement();
    run.updateComboMax(this.session.comboStreak);
    this.statusText.setText('정답!');

    const cellFx = firePuzzleEffects({
      deck: run.getDeck(),
      party: run.getParty(),
      trigger: 'on_cell_correct',
      solution: this.solution,
      grid: this.grid,
      modifiers: run.getPuzzleModifiers(),
      cell: { x, y },
      session: this.session,
    });
    this.applyEffectResult(run, cellFx);

    this.checkLineComplete(y, x);

    if (isSolutionComplete(this.solution, this.grid)) {
      this.queuePuzzleComplete(x, y);
      return;
    }

    this.releaseInputIfIdle();
  }

  private releaseInputIfIdle(): void {
    if (this.flashPending === 0 && !this.completionQueued && !this.finished) {
      this.inputLocked = false;
    }
  }

  private queuePuzzleComplete(x: number, y: number): void {
    if (this.finished || this.completionQueued) return;
    this.completionQueued = true;
    this.inputLocked = true;
    this.completionOrigin = { x, y };
    if (this.flashPending === 0) this.playCompletionFillSequence();
  }

  private onFlashDone(): void {
    if (this.completionQueued && this.flashPending === 0) {
      this.playCompletionFillSequence();
      return;
    }
    this.releaseInputIfIdle();
  }

  private playCompletionFillSequence(): void {
    this.completionQueued = false;
    this.inputLocked = true;

    const cells: { x: number; y: number; dist: number }[] = [];
    for (let y = 0; y < this.solution.length; y++) {
      for (let x = 0; x < this.solution[y]!.length; x++) {
        if (this.solution[y]![x] !== 1) continue;
        const dist =
          Math.abs(x - this.completionOrigin.x) + Math.abs(y - this.completionOrigin.y);
        cells.push({ x, y, dist });
      }
    }

    if (cells.length === 0) {
      this.finishPuzzleComplete();
      return;
    }

    cells.sort((a, b) => a.dist - b.dist || a.y - b.y || a.x - b.x);

    const { staggerMs, pulseMs, tailMs } = completionWaveTiming(cells.length);
    let remaining = cells.length;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]!;
      this.time.delayedCall(i * staggerMs, () => {
        this.pulseFillCell(cell.x, cell.y, pulseMs, () => {
          remaining--;
          if (remaining === 0) {
            this.time.delayedCall(tailMs, () => this.finishPuzzleComplete());
          }
        });
      });
    }
  }

  private pulseFillCell(x: number, y: number, pulseMs: number, onDone: () => void): void {
    const rect = this.cellRects[y]![x]!;
    this.grid[y]![x] = 'fill';
    rect.setFillStyle(COLORS.cellCorrect);
    this.flashPending++;

    this.tweens.add({
      targets: rect,
      scaleX: 1.14,
      scaleY: 1.14,
      duration: pulseMs,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        rect.setScale(1, 1);
        rect.setFillStyle(COLORS.cellFill);
        this.flashPending--;
        onDone();
      },
    });
  }

  private checkLineComplete(row: number, col: number): void {
    const run = this.getRun();
    let fx = emptyPuzzleResult();

    if (isRowResolved(this.solution, this.grid, row) && this.session.markLineResolved('row', row)) {
      fx = mergePuzzleResults(
        fx,
        firePuzzleEffects({
          deck: run.getDeck(),
          party: run.getParty(),
          trigger: 'on_line_complete',
          solution: this.solution,
          grid: this.grid,
          modifiers: run.getPuzzleModifiers(),
          line: { axis: 'row', index: row },
          session: this.session,
        }),
      );
    }

    if (isColResolved(this.solution, this.grid, col) && this.session.markLineResolved('col', col)) {
      fx = mergePuzzleResults(
        fx,
        firePuzzleEffects({
          deck: run.getDeck(),
          party: run.getParty(),
          trigger: 'on_line_complete',
          solution: this.solution,
          grid: this.grid,
          modifiers: run.getPuzzleModifiers(),
          line: { axis: 'col', index: col },
          session: this.session,
        }),
      );
    }

    const inkDeckCount = run.getDeck().countByConcept('잉크');
    if (inkDeckCount >= 6 && (isRowResolved(this.solution, this.grid, row) || isColResolved(this.solution, this.grid, col))) {
      fx = mergePuzzleResults(fx, {
        messages: ['덱 임계(잉크6+): 줄 완성 잉크 +1'],
        reveals: [],
        heal: 0,
        gold: 0,
        inkStackDelta: 1,
        attackStackDelta: 0,
      });
    }

    this.applyEffectResult(run, fx);
  }

  private applyEffectResult(run: RunState, fx: PuzzleEffectResult): void {
    if (fx.messages.length > 0) this.showEffect(fx.messages.join(' · '));
    this.applyReveals(fx.reveals);
    if (fx.comboShieldGrant) this.session.grantComboShield(fx.comboShieldGrant);
    if (fx.highlightLine) this.flashHighlightLine(fx.highlightLine);
    run.applyPuzzleEffectResult(fx);
    this.refreshHud();
  }

  private flashHighlightLine(line: { axis: 'row' | 'col'; index: number; durationSec: number }): void {
    const size = this.solution.length;
    const tint = 0x6a5acd;
    const holdMs = Math.min(1200, line.durationSec * 400);

    const cells: { x: number; y: number }[] = [];
    if (line.axis === 'row') {
      for (let x = 0; x < size; x++) cells.push({ x, y: line.index });
    } else {
      for (let y = 0; y < size; y++) cells.push({ x: line.index, y });
    }

    for (const { x, y } of cells) {
      const rect = this.cellRects[y]?.[x];
      if (!rect) continue;
      const state = this.grid[y]?.[x];
      const prevFill =
        state === 'fill' ? COLORS.cellFill : state === 'mark' ? COLORS.cellMark : COLORS.cellEmpty;
      rect.setFillStyle(tint);
      this.time.delayedCall(holdMs, () => {
        if (this.finished) return;
        const cur = this.grid[y]?.[x];
        if (cur === 'fill') rect.setFillStyle(COLORS.cellFill);
        else if (cur === 'mark') rect.setFillStyle(COLORS.cellMark);
        else rect.setFillStyle(prevFill);
      });
    }
  }

  private applyReveals(reveals: PuzzleEffectResult['reveals']): void {
    for (const r of reveals) {
      if (this.grid[r.y][r.x] !== 'empty') continue;
      this.grid[r.y][r.x] = r.shouldFill ? 'fill' : 'mark';
      this.refreshCell(r.x, r.y);
      this.flashCell(r.x, r.y, 0x5a4a8a);
    }
  }

  private showEffect(msg: string): void {
    this.effectText.setText(msg);
    this.time.delayedCall(2200, () => {
      if (this.effectText.text === msg) this.effectText.setText('');
    });
  }

  private finishPuzzleComplete(): void {
    if (this.finished) return;
    this.finished = true;
    this.inputLocked = true;

    const run = this.getRun();
    const puzzle = getSectionPuzzle(this.sectionIndex, this.getPuzzleSetId());

    const sectionFx = firePuzzleEffects({
      deck: run.getDeck(),
      party: run.getParty(),
      trigger: 'on_section_complete',
      solution: this.solution,
      grid: this.grid,
      modifiers: run.getPuzzleModifiers(),
      session: this.session,
    });
    this.applyEffectResult(run, sectionFx);

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
      sectionSubtitle: `${puzzle.label} · ${Math.round(this.session.getCompletionRate() * 100)}% · ${REWARD_LABELS[reward.type]}`,
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
    const rect = this.cellRects[y]![x]!;
    const prev = this.grid[y]![x];
    this.flashPending++;
    rect.setFillStyle(color);
    this.time.delayedCall(200, () => {
      if (prev === 'fill') rect.setFillStyle(COLORS.cellFill);
      else if (prev === 'mark') rect.setFillStyle(COLORS.cellMark);
      else rect.setFillStyle(COLORS.cellEmpty);
      this.flashPending--;
      this.onFlashDone();
    });
  }

  private getRun(): RunState {
    return this.registry.get('runState') as RunState;
  }
}
