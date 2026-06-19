import Phaser from 'phaser';
import { DRAFT_BONUS_GOLD, GAME_EVENTS, REWARD_LABELS, type SectionReward } from '@modules/reward';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import { getDraftBadge, openDraft, pickShopOffers, shopPrice } from '@modules/draft';
import { cardRepository, type InkCard } from '@modules/card';
import type { RunState } from '@modules/run';

const GRADE_COLOR: Record<string, string> = {
  common: '#aaaaaa',
  rare: '#7c5cff',
  epic: '#ffb347',
};

export interface RewardOverlayOptions {
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export class RewardOverlay {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, private onClose: () => void) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setDepth(100);
  }

  show(reward: SectionReward, run: RunState, options?: RewardOverlayOptions): void {
    const title = options?.sectionTitle ?? REWARD_LABELS[reward.type];
    const subtitle = options?.sectionSubtitle;

    switch (reward.type) {
      case 'draft':
        this.showDraft(run, title, subtitle, reward.goldAmount ?? DRAFT_BONUS_GOLD.min);
        break;
      case 'gold':
        this.showGold(reward.goldAmount ?? 8, run, title, subtitle);
        break;
      case 'shop':
        this.showShop(run, title, subtitle);
        break;
      case 'event':
        this.showEvent(run, title, subtitle);
        break;
      case 'heal':
        this.showHeal(run, title, subtitle);
        break;
      case 'trap':
        this.showTrap(run, title, subtitle);
        break;
    }
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private backdrop(title: string, subtitle?: string): void {
    const bg = this.scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setInteractive();
    const panel = this.scene.add
      .rectangle(0, 0, 720, 480, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    const titleText = this.scene.add
      .text(0, -200, title, {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);
    this.container.add([bg, panel, titleText]);

    if (subtitle) {
      const sub = this.scene.add
        .text(0, -168, subtitle, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#8888aa',
        })
        .setOrigin(0.5);
      this.container.add(sub);
    }
  }

  private closeButton(y: number, label = '닫기', onClick?: () => void): void {
    const btn = this.scene.add.rectangle(0, y, 160, 40, COLORS.accent).setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(0, y, label, { fontFamily: 'sans-serif', fontSize: '16px', color: '#fff' })
      .setOrigin(0.5);
    btn.on('pointerdown', () => {
      onClick?.();
      this.onClose();
    });
    this.container.add([btn, text]);
  }

  private showDraft(run: RunState, title: string, subtitle: string | undefined, bonusGold: number): void {
    const party = run.getParty();
    const deck = run.getDeck();
    const cards = openDraft(run, deck, party);

    run.addGold(bonusGold);
    const draftSub = subtitle
      ? `${subtitle}\n카드 3장 중 1장 + 보너스 골드 +${bonusGold}`
      : `카드 3장 중 1장을 덱에 추가 · +${bonusGold} 골드`;

    this.backdrop(title, draftSub);

    const startX = -220;
    cards.forEach((card, i) => {
      const x = startX + i * 220;
      this.renderCardChoice(x, -20, card, run, () => {
        deck.add(card);
        this.onClose();
      });
    });

    this.closeButton(190, '맵으로');
  }

  private renderCardChoice(
    x: number,
    y: number,
    card: InkCard,
    run: RunState,
    onPick: () => void,
  ): void {
    const party = run.getParty();
    const deck = run.getDeck();
    const badge = getDraftBadge(card, party, deck);
    const gradeColor = GRADE_COLOR[card.grade] ?? '#aaa';

    const box = this.scene.add
      .rectangle(x, y, 200, 220, 0x242438)
      .setStrokeStyle(2, parseInt(gradeColor.slice(1), 16))
      .setInteractive({ useHandCursor: true });

    const name = this.scene.add
      .text(x, y - 72, card.name, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f0f0f5',
        align: 'center',
        wordWrap: { width: 180 },
      })
      .setOrigin(0.5);

    const meta = this.scene.add
      .text(x, y - 42, `${card.conceptPrimary} · ${card.grade}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: gradeColor,
      })
      .setOrigin(0.5);

    const desc = this.scene.add
      .text(x, y + 20, card.description, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8888aa',
        align: 'center',
        wordWrap: { width: 180 },
      })
      .setOrigin(0.5);

    this.container.add([box, name, meta, desc]);

    if (badge) {
      const tag = this.scene.add
        .text(x + 72, y - 95, badge, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#fff',
          backgroundColor: '#7c5cff',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5);
      this.container.add(tag);
    }

    box.on('pointerdown', onPick);
    box.on('pointerover', () => box.setFillStyle(0x32324a));
    box.on('pointerout', () => box.setFillStyle(0x242438));
  }

  private showGold(amount: number, run: RunState, title: string, subtitle?: string): void {
    this.backdrop(title, subtitle ?? `+${amount} 골드`);
    run.addGold(amount);
    const t = this.scene.add
      .text(0, -20, `💰 ${amount}`, {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#ffd700',
      })
      .setOrigin(0.5);
    this.container.add(t);
    this.closeButton(80, '맵으로');
  }

  private showShop(run: RunState, title: string, subtitle?: string): void {
    const deck = run.getDeck();
    const offers = pickShopOffers(run, deck, run.getParty(), 3);
    this.backdrop(title, subtitle ?? `골드 ${run.getProgress().gold} · 덱 ${deck.size}장`);

    offers.forEach((card, i) => {
      const x = -220 + i * 220;
      const price = shopPrice(card);
      const box = this.scene.add
        .rectangle(x, -30, 200, 200, 0x242438)
        .setStrokeStyle(2, COLORS.accent)
        .setInteractive({ useHandCursor: true });

      const label = this.scene.add
        .text(x, -80, card.name, {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: '#f0f0f5',
          align: 'center',
          wordWrap: { width: 180 },
        })
        .setOrigin(0.5);

      const priceText = this.scene.add
        .text(x, 50, `🪙 ${price}`, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#ffd700',
        })
        .setOrigin(0.5);

      box.on('pointerdown', () => {
        if (!run.spendGold(price)) return;
        deck.add(card);
        box.setFillStyle(0x3dd68c);
        priceText.setText('구매 완료');
        box.disableInteractive();
      });

      this.container.add([box, label, priceText]);
    });

    const deckY = 120;
    const deckCards = deck.getAll();
    if (deckCards.length > 0) {
      const hint = this.scene.add
        .text(0, deckY - 24, '카드 삭제 (5골드)', {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#8888aa',
        })
        .setOrigin(0.5);
      this.container.add(hint);

      deckCards.slice(0, 4).forEach((card, i) => {
        const bx = -150 + i * 100;
        const btn = this.scene.add
          .rectangle(bx, deckY + 20, 90, 36, 0x1a1a2e)
          .setStrokeStyle(1, 0x555566)
          .setInteractive({ useHandCursor: true });
        const txt = this.scene.add
          .text(bx, deckY + 20, card.name.slice(0, 4), {
            fontFamily: 'sans-serif',
            fontSize: '11px',
            color: '#aaa',
          })
          .setOrigin(0.5);
        btn.on('pointerdown', () => {
          if (!run.spendGold(5)) return;
          const idx = deck.getAll().indexOf(card);
          deck.removeAt(idx);
          btn.destroy();
          txt.setText('삭제됨');
          btn.disableInteractive();
        });
        this.container.add([btn, txt]);
      });
    }

    this.closeButton(200, '맵으로');
  }

  private showEvent(run: RunState, title: string, subtitle?: string): void {
    const event = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
    this.backdrop(title, subtitle ?? event.title);

    const body = this.scene.add
      .text(0, -40, event.description, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#ccc',
        align: 'center',
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5);
    this.container.add(body);

    this.closeButton(120, '맵으로', () => {
      if (event.id === 'ink_windfall') run.addGold(15);
      if (event.id === 'whisper_curse') run.addMistake();
      if (event.id === 'mystery_trade') {
        const pool = cardRepository.getDraftPool().filter((c) => c.grade === 'common');
        const card = pool[Math.floor(Math.random() * pool.length)];
        if (card) run.getDeck().add(card);
      }
    });
  }

  private showHeal(run: RunState, title: string, subtitle?: string): void {
    this.backdrop(title, subtitle ?? 'HP 회복');
    run.heal(2);
    const t = this.scene.add
      .text(0, -20, `HP ${run.getHp()} / 10`, {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#3dd68c',
      })
      .setOrigin(0.5);
    this.container.add(t);
    this.closeButton(80, '맵으로');
  }

  private showTrap(run: RunState, title: string, subtitle?: string): void {
    this.backdrop(title, subtitle ?? '함정 발동!');
    run.addMistake();
    const t = this.scene.add
      .text(0, -20, '실수 +1 · HP -1', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#e85d5d',
      })
      .setOrigin(0.5);
    this.container.add(t);
    this.closeButton(80, '맵으로');
  }
}
