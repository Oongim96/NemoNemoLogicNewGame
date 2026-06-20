import Phaser from 'phaser';
import { buildCardStrategyTags, type InkCard } from '@modules/card';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import type { RunState } from '@modules/run';
import { cardArtKey } from '@ui/collection-detail-art';
import { buildCardDetailSections } from '@ui/card-detail.util';
import {
  CARD_GRADE_KO,
  CollectionDetailOverlay,
  GRADE_BORDER,
} from '@ui/collection-detail-overlay';
import {
  BattleFormationBoard,
  FORMATION_LAYOUT,
} from '@ui/battle-formation-board';

export class BattleSetupScene extends Phaser.Scene {
  private board: BattleFormationBoard | null = null;
  private detailOverlay: CollectionDetailOverlay | null = null;

  constructor() {
    super('BattleSetupScene');
  }

  create(): void {
    const run = this.registry.get('runState') as RunState;
    const party = run.getParty();
    const charName = party.members[0]?.name ?? '파티';
    const cards = [...run.getDeck().getAll()];
    const enemyHp = run.getEnemyHpForBattle();

    run.initBattleFormation();
    let order = run.getBattleFormation();

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 44, '전투 배치', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 72, `${charName} · 덱 ${cards.length}장 · 적 HP ${enemyHp}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 88, '버프·스택을 앞(①)에, 공격을 뒤에 두면 유리합니다', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#666680',
      })
      .setOrigin(0.5);

    const scrollBg = this.add
      .rectangle(
        GAME_WIDTH / 2,
        (FORMATION_LAYOUT.top + FORMATION_LAYOUT.bottom) / 2,
        GAME_WIDTH,
        FORMATION_LAYOUT.bottom - FORMATION_LAYOUT.top,
        0x000000,
        0,
      )
      .setInteractive();

    this.board = new BattleFormationBoard(
      this,
      FORMATION_LAYOUT.top,
      FORMATION_LAYOUT.bottom,
      (next) => {
        order = next;
        run.setBattleFormation(next);
      },
      (card) => this.showCardDetail(card),
    );
    this.board.build(cards, order);
    this.board.enableBackgroundScroll(scrollBg);

    const resetBtn = this.add
      .text(20, GAME_HEIGHT - 36, '↺ 초기화', { fontSize: '13px', color: '#7c5cff' })
      .setInteractive({ useHandCursor: true });

    resetBtn.on('pointerdown', () => {
      run.initBattleFormation();
      order = run.getBattleFormation();
      this.board?.build(cards, order);
    });

    const startBtn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 88, GAME_WIDTH - 48, 48, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 88, '전투 시작', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#fff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x9b8aff));
    startBtn.on('pointerout', () => startBtn.setFillStyle(COLORS.accent));
    startBtn.on('pointerdown', () => {
      run.setBattleFormation(order);
      this.scene.start('AutoBattleScene');
    });
  }

  private showCardDetail(card: InkCard): void {
    const borderColor = GRADE_BORDER[card.grade] ?? COLORS.accent;
    const gradeLabel = CARD_GRADE_KO[card.grade] ?? card.grade;
    const conceptLine = card.conceptSecondary
      ? `${card.conceptPrimary} · ${card.conceptSecondary}`
      : card.conceptPrimary;

    this.detailOverlay?.destroy();
    this.detailOverlay = new CollectionDetailOverlay(this, () => {
      this.detailOverlay = null;
    });

    this.detailOverlay.show({
      art: {
        kind: 'card',
        borderColor,
        conceptPrimary: card.conceptPrimary,
        gradeLabel,
        textureKey: cardArtKey(card.cardId),
      },
      title: card.name,
      subtitle: conceptLine,
      chips: buildCardStrategyTags(card),
      borderColor,
      sections: buildCardDetailSections(card),
    });
  }

  shutdown(): void {
    this.detailOverlay?.destroy();
    this.detailOverlay = null;
    this.board?.destroy();
    this.board = null;
  }
}
