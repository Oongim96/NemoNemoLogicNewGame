import { GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';

/** RewardOverlay — 모바일 세로 기준 고정 레이아웃 (겹침 방지) */
export const REWARD_LAYOUT = {
  marginX: 16,
  panelTop: 56,
  panelBottom: GAME_HEIGHT - 24,
  headerPad: 16,
  footerH: 48,
  tabH: 36,
  get panelW(): number {
    return GAME_WIDTH - this.marginX * 2;
  },
  get panelH(): number {
    return this.panelBottom - this.panelTop;
  },
  get headerY(): number {
    return this.panelTop + this.headerPad;
  },
  get contentTop(): number {
    return this.panelTop + 88;
  },
  get contentBottom(): number {
    return this.panelBottom - this.footerH - 8;
  },
  get contentH(): number {
    return this.contentBottom - this.contentTop;
  },
  get footerY(): number {
    return this.panelBottom - this.footerH / 2 - 4;
  },
  get centerX(): number {
    return GAME_WIDTH / 2;
  },
} as const;

export function draftRowHeight(count: number): number {
  const gap = 8;
  const available = REWARD_LAYOUT.contentH - gap * (count - 1);
  return Math.min(92, Math.floor(available / count));
}

export function shopOfferRowHeight(): number {
  return 64;
}

export function shopSellRowHeight(): number {
  return 48;
}
