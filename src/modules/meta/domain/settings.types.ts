export interface GameSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  language: 'ko' | 'en';
}

export const DEFAULT_SETTINGS: GameSettings = {
  bgmEnabled: true,
  sfxEnabled: true,
  language: 'ko',
};
