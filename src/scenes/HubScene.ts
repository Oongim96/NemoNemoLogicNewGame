import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { getCharacterDef, type PlayerProfile } from '@modules/meta';
import { drawBattleStartButton, drawLobbyShell } from '@ui/mobile-shell';

export class HubScene extends Phaser.Scene {
  constructor() {
    super('HubScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    const char = getCharacterDef(profile.getSelectedCharacterId());

    drawLobbyShell(this);

    // 숲 배경 느낌 (와이어)
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, GAME_WIDTH, GAME_HEIGHT * 0.55, 0x1a2e1a, 0.4);

    // 출전 캐릭터 (크게)
    const heroY = GAME_HEIGHT * 0.38;
    const portraitR = 72;
    const gradeColor = char?.grade === 'SSR' ? 0xffd700 : 0x9b7fff;

    this.add.circle(GAME_WIDTH / 2, heroY, portraitR + 8, 0x000000, 0.3);
    this.add.circle(GAME_WIDTH / 2, heroY, portraitR, COLORS.panel).setStrokeStyle(4, gradeColor);
    const portraitHit = this.add
      .circle(GAME_WIDTH / 2, heroY, portraitR + 8, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    portraitHit.on('pointerdown', () => this.scene.start('CharacterScene'));
    this.add
      .text(GAME_WIDTH / 2, heroY - 8, char?.primaryConcept === '잉크' ? '🖌' : '✨', { fontSize: '56px' })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, heroY + portraitR + 20, char?.name ?? '???', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, heroY + portraitR + 46, `${char?.grade ?? 'SR'} · ${char?.primaryConcept ?? ''} · ${char?.tagline ?? ''}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, heroY + portraitR + 68, '캐릭 탭에서 출전 변경', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#555566',
      })
      .setOrigin(0.5);

    // 전투 시작 — 중앙 하단 (네비 위)
    const playY = LAYOUT.CONTENT_BOTTOM - 56;
    drawBattleStartButton(this, playY, '⚔  전투 시작', () => {
      this.scene.start('StageSelectScene');
    });
  }
}
