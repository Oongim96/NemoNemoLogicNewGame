import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import {
  buildMultiPullTiles,
  buildSinglePullTiles,
  CARD_GRADE_LABEL,
  gachaCardHitRate,
  GACHA_CARD_GRADE_RATES,
  GACHA_CHARACTER_HIT_RATE,
  GACHA_CHARACTER_SSR_RATE,
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
} from '@modules/gacha';
import { CHARACTER_ROSTER, type PlayerProfile } from '@modules/meta';
import { cardRepository } from '@modules/card';
import { drawMobileShell } from '@ui/mobile-shell';
import { GachaRevealOverlay } from '@ui/gacha-reveal-overlay';

const PAD = 16;
const BTN_H = 48;
const BTN_GAP = 10;

function gachaContentBounds() {
  const top = LAYOUT.CONTENT_TOP + PAD;
  const bottom = LAYOUT.CONTENT_BOTTOM - PAD;
  return { top, bottom, height: bottom - top, cx: GAME_WIDTH / 2, w: GAME_WIDTH - 32 };
}

function countCollectibles(profile: PlayerProfile): { chars: string; cards: string } {
  const charTotal = CHARACTER_ROSTER.length;
  const cardTotal = cardRepository.getAllCards().filter((c) => c.enabled && c.draftWeight > 0).length;
  return {
    chars: `${profile.getOwnedCharacterIds().length}/${charTotal}`,
    cards: `${profile.getOwnedCardIds().length}/${cardTotal}`,
  };
}

export class GachaScene extends Phaser.Scene {
  private gemsText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private revealOverlay: GachaRevealOverlay | null = null;
  private pullLocked = false;

  constructor() {
    super('GachaScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    drawMobileShell(this, '가챠', 'gacha');

    const { top, bottom, cx, w } = gachaContentBounds();
    const btnBlockH = BTN_H * 2 + BTN_GAP;
    const btnAreaTop = bottom - btnBlockH;

    const bannerH = 108;
    const bannerY = top + bannerH / 2;
    this.add.rectangle(cx, bannerY, w, bannerH, 0x2a1a4a).setStrokeStyle(2, COLORS.accent);

    this.add
      .text(cx, top + 16, '✨ 소환', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const coll = countCollectibles(profile);
    const charHitPct = Math.round(GACHA_CHARACTER_HIT_RATE * 100);
    const cardHitPct = Math.round(gachaCardHitRate() * 100);
    this.add
      .text(
        cx,
        top + 40,
        `캐릭 ${coll.chars} · 카드 ${coll.cards} · 캐릭 ${charHitPct}% 또는 카드 ${cardHitPct}%`,
        {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#8888aa',
        },
      )
      .setOrigin(0.5);

    const cardRates = GACHA_CARD_GRADE_RATES.map(
      ({ grade, weight }) => `${CARD_GRADE_LABEL[grade]} ${Math.round(weight * 100)}%`,
    ).join(' · ');
    this.add
      .text(cx, top + 58, `캐릭 SSR ${Math.round(GACHA_CHARACTER_SSR_RATE * 100)}% · 카드 등급 ${cardRates}`, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#666680',
      })
      .setOrigin(0.5);

    this.gemsText = this.add
      .text(cx - 60, top + 82, `💎 ${profile.getGems()}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffb3e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.goldText = this.add
      .text(cx + 60, top + 82, `🪙 ${profile.getGold()}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const stageTop = top + bannerH + 20;
    const stageH = btnAreaTop - stageTop - 16;
    const stageY = stageTop + stageH / 2;

    this.add.rectangle(cx, stageY, w, stageH, COLORS.panel).setStrokeStyle(1, 0x3a3a55);

    this.add
      .text(cx, stageTop + 24, '✦', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#5a4a8a',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(cx, stageY + 20, '1회 = 캐릭터 또는 카드 1개\n눌러서 하나씩 확인', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#8888aa',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    const btn1Y = btnAreaTop + BTN_H / 2;
    const btn2Y = btn1Y + BTN_H + BTN_GAP;
    this.makePullBtn(cx, btn1Y, w - 16, `1회 소환 · ${GACHA_COST_SINGLE}💎`, () => this.pull(profile));
    this.makePullBtn(cx, btn2Y, w - 16, `10회 소환 · ${GACHA_COST_TEN}💎`, () => this.pullTen(profile));
  }

  private refreshHud(profile: PlayerProfile): void {
    this.gemsText.setText(`💎 ${profile.getGems()}`);
    this.goldText.setText(`🪙 ${profile.getGold()}`);
    const coll = countCollectibles(profile);
    this.statusText.setText(`최근 소환 완료\n캐릭 ${coll.chars} · 카드 ${coll.cards}`);
  }

  private makePullBtn(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
  ): void {
    const btn = this.add
      .rectangle(x, y, width, BTN_H, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: '15px', color: '#fff', fontStyle: 'bold' })
      .setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0x9b8aff));
    btn.on('pointerout', () => btn.setFillStyle(COLORS.accent));
    btn.on('pointerdown', onClick);
  }

  private openReveal(tiles: ReturnType<typeof buildSinglePullTiles>, title: string, profile: PlayerProfile): void {
    this.revealOverlay?.destroy();
    this.pullLocked = true;
    this.revealOverlay = new GachaRevealOverlay(this, () => {
      this.revealOverlay = null;
      this.pullLocked = false;
      this.refreshHud(profile);
    });
    this.revealOverlay.show(tiles, title);
  }

  private pull(profile: PlayerProfile): void {
    if (this.pullLocked) return;
    const result = profile.pullGacha();
    if (!result) {
      this.statusText.setColor('#e85d5d');
      this.statusText.setText('💎가 부족합니다');
      return;
    }
    this.statusText.setColor('#8888aa');
    this.refreshHud(profile);
    this.openReveal(buildSinglePullTiles(result), '1회 소환', profile);
  }

  private pullTen(profile: PlayerProfile): void {
    if (this.pullLocked) return;
    const results = profile.pullTenGacha();
    if (results.length === 0) {
      this.statusText.setColor('#e85d5d');
      this.statusText.setText(`💎가 부족합니다 (${GACHA_COST_TEN} 필요)`);
      return;
    }
    this.statusText.setColor('#8888aa');
    this.refreshHud(profile);
    this.openReveal(buildMultiPullTiles(results), '10회 소환', profile);
  }
}
