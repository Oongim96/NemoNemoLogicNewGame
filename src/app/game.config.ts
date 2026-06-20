/** 모바일 세로 기준 해상도 (9:19.5 근사) */
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const LAYOUT = {
  TOP_BAR: 52,
  BOTTOM_NAV: 76,
  SAFE_TOP: 8,
  CONTENT_TOP: 60,
  get CONTENT_BOTTOM(): number {
    return GAME_HEIGHT - this.BOTTOM_NAV;
  },
} as const;

export const COLORS = {
  background: 0x0d0d14,
  panel: 0x1a1a2e,
  accent: 0x7c5cff,
  navBar: 0x12121c,
  navActive: 0x7c5cff,
  text: 0xf0f0f5,
  textMuted: 0x8888aa,
  cellEmpty: 0x2a2a3e,
  cellFill: 0x4a90d9,
  cellMark: 0x555566,
  cellCorrect: 0x3dd68c,
  cellWrong: 0xe85d5d,
} as const;
