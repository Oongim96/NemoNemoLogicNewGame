import Phaser from 'phaser';
import { DRAFT_BONUS_GOLD, GAME_EVENTS, REWARD_LABELS, type SectionReward } from '@modules/reward';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import { getDraftBadge, openDraft, pickShopOffers, sellPrice, shopPrice } from '@modules/draft';
import { cardRepository, type InkCard } from '@modules/card';
import type { RunState } from '@modules/run';
import {
  draftRowHeight,
  REWARD_LAYOUT,
  shopOfferRowHeight,
  shopSellRowHeight,
} from '@ui/reward-overlay-layout';

const GRADE_COLOR: Record<string, string> = {
  common: '#aaaaaa',
  rare: '#7c5cff',
  epic: '#ffb347',
};

export interface RewardOverlayOptions {
  sectionTitle?: string;
  sectionSubtitle?: string;
}

type ShopTab = 'buy' | 'sell';

export class RewardOverlay {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private hudText: Phaser.GameObjects.Text | null = null;
  private shopContent: Phaser.GameObjects.Container | null = null;
  private shopTab: ShopTab = 'buy';
  private buyTabBg: Phaser.GameObjects.Rectangle | null = null;
  private sellTabBg: Phaser.GameObjects.Rectangle | null = null;
  private buyTabLabel: Phaser.GameObjects.Text | null = null;
  private sellTabLabel: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, private onClose: () => void) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(200);
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

  private drawChrome(title: string, subtitle?: string): void {
    const L = REWARD_LAYOUT;

    const dim = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setInteractive();

    const panelX = L.marginX + L.panelW / 2;
    const panelY = L.panelTop + L.panelH / 2;
    const panel = this.scene.add
      .rectangle(panelX, panelY, L.panelW, L.panelH, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);

    const titleText = this.scene.add
      .text(L.centerX, L.headerY, title, {
        fontFamily: 'sans-serif',
        fontSize: '19px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    this.container.add([dim, panel, titleText]);

    if (subtitle) {
      const sub = this.scene.add
        .text(L.centerX, L.headerY + 28, subtitle, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#8888aa',
          align: 'center',
          wordWrap: { width: L.panelW - 32 },
        })
        .setOrigin(0.5, 0);
      this.container.add(sub);
    }
  }

  private drawFooter(label = '맵으로', onClick?: () => void): Phaser.GameObjects.Rectangle {
    const L = REWARD_LAYOUT;
    const btn = this.scene.add
      .rectangle(L.centerX, L.footerY, L.panelW - 32, 44, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add
      .text(L.centerX, L.footerY, label, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => {
      onClick?.();
      this.onClose();
    });

    this.container.add([btn, text]);
    return btn;
  }

  private showDraft(run: RunState, title: string, subtitle: string | undefined, bonusGold: number): void {
    const party = run.getParty();
    const deck = run.getDeck();
    const cards = openDraft(run, deck, party);

    run.addGold(bonusGold);
    const draftSub = subtitle
      ? `${subtitle}\n+${bonusGold} 골드 · 아래 3장 중 1장 선택`
      : `카드 3장 중 1장 · +${bonusGold} 골드`;

    this.drawChrome(title, draftSub);

    const L = REWARD_LAYOUT;
    const rowH = draftRowHeight(cards.length);
    const totalH = rowH * cards.length + 8 * (cards.length - 1);
    let y = L.contentTop + Math.max(0, (L.contentH - totalH) / 2) + rowH / 2;

    cards.forEach((card) => {
      this.renderCardChoice(L.centerX, y, card, run, L.panelW - 32, rowH, () => {
        deck.add(card);
        run.refreshPuzzleModifiers();
        this.onClose();
      });
      y += rowH + 8;
    });

    this.drawFooter();
  }

  private renderCardChoice(
    x: number,
    y: number,
    card: InkCard,
    run: RunState,
    width: number,
    height: number,
    onPick: () => void,
  ): void {
    const party = run.getParty();
    const deck = run.getDeck();
    const badge = getDraftBadge(card, party, deck);
    const gradeColor = GRADE_COLOR[card.grade] ?? '#aaa';

    const box = this.scene.add
      .rectangle(x, y, width, height, 0x242438)
      .setStrokeStyle(2, parseInt(gradeColor.slice(1), 16))
      .setInteractive({ useHandCursor: true });

    const left = x - width / 2 + 12;
    const name = this.scene.add
      .text(left, y - height / 2 + 18, card.name, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const meta = this.scene.add
      .text(left, y - height / 2 + 38, `${card.conceptPrimary} · ${card.grade}`, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: gradeColor,
      })
      .setOrigin(0, 0.5);

    const desc = this.scene.add
      .text(left, y - height / 2 + 58, card.description, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#8888aa',
        wordWrap: { width: width - 24 },
      })
      .setOrigin(0, 0.5);

    this.container.add([box, name, meta, desc]);

    if (badge) {
      const tag = this.scene.add
        .text(x + width / 2 - 10, y - height / 2 + 14, badge, {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: '#fff',
          backgroundColor: '#7c5cff',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(1, 0.5);
      this.container.add(tag);
    }

    box.on('pointerdown', onPick);
    box.on('pointerover', () => box.setFillStyle(0x32324a));
    box.on('pointerout', () => box.setFillStyle(0x242438));
  }

  private showGold(amount: number, run: RunState, title: string, subtitle?: string): void {
    this.drawChrome(title, subtitle ?? `+${amount} 골드`);
    run.addGold(amount);

    const t = this.scene.add
      .text(REWARD_LAYOUT.centerX, REWARD_LAYOUT.contentTop + REWARD_LAYOUT.contentH / 2 - 20, `💰 +${amount}`, {
        fontFamily: 'sans-serif',
        fontSize: '42px',
        color: '#ffd700',
      })
      .setOrigin(0.5);

    this.container.add(t);
    this.drawFooter();
  }

  private showShop(run: RunState, title: string, subtitle?: string): void {
    this.drawChrome(title, subtitle ?? '덱을 편집하세요');
    this.renderShopHud(run);
    this.renderShopTabs(run);
    this.renderShopPanel(run);
    this.drawFooter();
  }

  private renderShopHud(run: RunState): void {
    const L = REWARD_LAYOUT;
    const gold = run.getProgress().gold;
    const deckSize = run.getDeck().size;

    this.hudText = this.scene.add
      .text(L.centerX, L.contentTop - 6, `🪙 ${gold}  ·  덱 ${deckSize}장`, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1);

    this.container.add(this.hudText);
  }

  private refreshShopHud(run: RunState): void {
    if (!this.hudText) return;
    const gold = run.getProgress().gold;
    const deckSize = run.getDeck().size;
    this.hudText.setText(`🪙 ${gold}  ·  덱 ${deckSize}장`);
  }

  private renderShopTabs(run: RunState): void {
    const L = REWARD_LAYOUT;
    const tabY = L.contentTop + 8;
    const tabW = (L.panelW - 40) / 2;

    this.drawTab(L.centerX - tabW / 2 - 4, tabY, tabW, '구매', this.shopTab === 'buy', () => {
      this.setShopTab('buy', run);
    }, true);

    this.drawTab(L.centerX + tabW / 2 + 4, tabY, tabW, '판매', this.shopTab === 'sell', () => {
      this.setShopTab('sell', run);
    }, false);
  }

  private setShopTab(tab: ShopTab, run: RunState): void {
    this.shopTab = tab;
    this.updateTabVisuals();
    this.rerenderShopPanel(run);
  }

  private updateTabVisuals(): void {
    const active = 0x7c5cff;
    const idle = 0x242438;
    const buyActive = this.shopTab === 'buy';

    this.buyTabBg?.setFillStyle(buyActive ? active : idle);
    this.sellTabBg?.setFillStyle(buyActive ? idle : active);
    this.buyTabLabel?.setColor(buyActive ? '#ffffff' : '#8888aa');
    this.buyTabLabel?.setFontStyle(buyActive ? 'bold' : 'normal');
    this.sellTabLabel?.setColor(buyActive ? '#8888aa' : '#ffffff');
    this.sellTabLabel?.setFontStyle(buyActive ? 'normal' : 'bold');
  }

  private drawTab(
    x: number,
    y: number,
    w: number,
    label: string,
    active: boolean,
    onClick: () => void,
    isBuy: boolean,
  ): void {
    const h = REWARD_LAYOUT.tabH;
    const bg = this.scene.add
      .rectangle(x, y + h / 2, w, h, active ? 0x7c5cff : 0x242438)
      .setStrokeStyle(1, active ? 0x9b8aff : 0x3a3a50)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add
      .text(x, y + h / 2, label, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: active ? '#ffffff' : '#8888aa',
        fontStyle: active ? 'bold' : 'normal',
      })
      .setOrigin(0.5);

    bg.on('pointerdown', onClick);
    this.container.add([bg, text]);

    if (isBuy) {
      this.buyTabBg = bg;
      this.buyTabLabel = text;
    } else {
      this.sellTabBg = bg;
      this.sellTabLabel = text;
    }
  }

  private rerenderShopPanel(run: RunState): void {
    this.shopContent?.destroy(true);
    this.shopContent = null;
    this.renderShopPanel(run);
  }

  private renderShopPanel(run: RunState): void {
    const L = REWARD_LAYOUT;
    const listTop = L.contentTop + REWARD_LAYOUT.tabH + 20;
    const listH = L.contentBottom - listTop;

    this.shopContent = this.scene.add.container(0, 0);
    this.container.add(this.shopContent);

    if (this.shopTab === 'buy') {
      this.renderShopBuy(run, listTop, listH);
    } else {
      this.renderShopSell(run, listTop, listH);
    }
  }

  private renderShopBuy(run: RunState, listTop: number, listH: number): void {
    const deck = run.getDeck();
    const offers = pickShopOffers(run, deck, run.getParty(), 3);
    const L = REWARD_LAYOUT;
    const rowH = shopOfferRowHeight();
    const gap = 8;
    const total = offers.length * rowH + (offers.length - 1) * gap;
    let y = listTop + Math.max(0, (listH - total) / 2) + rowH / 2;

    if (offers.length === 0) {
      const empty = this.scene.add
        .text(L.centerX, listTop + listH / 2, '진열 카드 없음', {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#666680',
        })
        .setOrigin(0.5);
      this.shopContent!.add(empty);
      return;
    }

    offers.forEach((card) => {
      const price = shopPrice(card);
      const w = L.panelW - 32;
      const owned = deck.countById(card.cardId) >= card.maxPerDeck;

      const box = this.scene.add
        .rectangle(L.centerX, y, w, rowH, 0x242438)
        .setStrokeStyle(2, owned ? 0x555566 : COLORS.accent);

      const left = L.centerX - w / 2 + 12;
      const name = this.scene.add
        .text(left, y - 12, card.name, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#f0f0f5',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      const meta = this.scene.add
        .text(left, y + 10, `${card.conceptPrimary} · ${card.grade}`, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: GRADE_COLOR[card.grade] ?? '#aaa',
        })
        .setOrigin(0, 0.5);

      const priceText = this.scene.add
        .text(L.centerX + w / 2 - 12, y, owned ? 'MAX' : `🪙 ${price}`, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: owned ? '#666680' : '#ffd700',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);

      this.shopContent!.add([box, name, meta, priceText]);

      if (!owned) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerover', () => box.setFillStyle(0x32324a));
        box.on('pointerout', () => box.setFillStyle(0x242438));
        box.on('pointerdown', () => {
          if (!run.spendGold(price)) {
            priceText.setColor('#e85d5d');
            priceText.setText('골드 부족');
            return;
          }
          if (!deck.add(card)) return;
          run.refreshPuzzleModifiers();
          box.setFillStyle(0x3dd68c);
          priceText.setText('구매 완료');
          priceText.setColor('#ffffff');
          box.disableInteractive();
          this.refreshShopHud(run);
        });
      }

      y += rowH + gap;
    });
  }

  private renderShopSell(run: RunState, listTop: number, listH: number): void {
    const deck = run.getDeck();
    const cards = deck.getAll();
    const L = REWARD_LAYOUT;
    const rowH = shopSellRowHeight();
    const gap = 6;
    const maxVisible = Math.floor((listH + gap) / (rowH + gap));
    const visible = cards.slice(0, maxVisible);

    if (cards.length === 0) {
      const empty = this.scene.add
        .text(L.centerX, listTop + listH / 2, '판매할 카드가 없습니다', {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#666680',
        })
        .setOrigin(0.5);
      this.shopContent!.add(empty);
      return;
    }

    let y = listTop + rowH / 2 + 16;
    const w = L.panelW - 32;

    visible.forEach((card, index) => {
      const price = sellPrice(card);
      const box = this.scene.add
        .rectangle(L.centerX, y, w, rowH, 0x242438)
        .setStrokeStyle(1, 0x3a3a50)
        .setInteractive({ useHandCursor: true });

      const left = L.centerX - w / 2 + 12;
      const name = this.scene.add
        .text(left, y, card.name, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#f0f0f5',
        })
        .setOrigin(0, 0.5);

      const meta = this.scene.add
        .text(left + 120, y, card.conceptPrimary, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#8888aa',
        })
        .setOrigin(0, 0.5);

      const priceText = this.scene.add
        .text(L.centerX + w / 2 - 12, y, `+🪙 ${price}`, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#3dd68c',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);

      box.on('pointerover', () => box.setFillStyle(0x32324a));
      box.on('pointerout', () => box.setFillStyle(0x242438));
      box.on('pointerdown', () => {
        deck.removeAt(index);
        run.addGold(price);
        run.refreshPuzzleModifiers();
        this.refreshShopHud(run);
        this.rerenderShopPanel(run);
      });

      this.shopContent!.add([box, name, meta, priceText]);
      y += rowH + gap;
    });

    if (cards.length > maxVisible) {
      const hint = this.scene.add
        .text(L.centerX, y + 4, `외 ${cards.length - maxVisible}장 — 판매 후 목록 갱신`, {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: '#555566',
        })
        .setOrigin(0.5, 0);
      this.shopContent!.add(hint);
    }
  }

  private showEvent(run: RunState, title: string, subtitle?: string): void {
    const event = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
    this.drawChrome(title, subtitle ?? event.title);

    const body = this.scene.add
      .text(
        REWARD_LAYOUT.centerX,
        REWARD_LAYOUT.contentTop + REWARD_LAYOUT.contentH / 2 - 40,
        event.description,
        {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: '#ccc',
          align: 'center',
          wordWrap: { width: REWARD_LAYOUT.panelW - 40 },
        },
      )
      .setOrigin(0.5, 0);

    this.container.add(body);
    this.drawFooter('맵으로', () => {
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
    this.drawChrome(title, subtitle ?? 'HP 회복');
    run.heal(2);

    const t = this.scene.add
      .text(
        REWARD_LAYOUT.centerX,
        REWARD_LAYOUT.contentTop + REWARD_LAYOUT.contentH / 2,
        `❤ HP ${run.getHp()} / 10`,
        {
          fontFamily: 'sans-serif',
          fontSize: '28px',
          color: '#3dd68c',
        },
      )
      .setOrigin(0.5);

    this.container.add(t);
    this.drawFooter();
  }

  private showTrap(run: RunState, title: string, subtitle?: string): void {
    this.drawChrome(title, subtitle ?? '함정 발동!');
    run.addMistake();

    const t = this.scene.add
      .text(
        REWARD_LAYOUT.centerX,
        REWARD_LAYOUT.contentTop + REWARD_LAYOUT.contentH / 2,
        '실수 +1 · HP -1',
        {
          fontFamily: 'sans-serif',
          fontSize: '22px',
          color: '#e85d5d',
        },
      )
      .setOrigin(0.5);

    this.container.add(t);
    this.drawFooter();
  }
}
