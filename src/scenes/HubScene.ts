import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import type { PlayerProfile } from '@modules/meta';
import { drawMobileShell } from '@ui/mobile-shell';

export class HubScene extends Phaser.Scene {
  constructor() {
    super('HubScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    const party = profile.getPartyConfig();
    const contentBottom = LAYOUT.CONTENT_BOTTOM;

    drawMobileShell(this, '픽셀 던전', 'home');

    // 메인 비주얼 영역
    const heroY = LAYOUT.CONTENT_TOP + 100;
    this.add
      .rectangle(GAME_WIDTH / 2, heroY, GAME_WIDTH - 32, 200, 0x14141f)
      .setStrokeStyle(2, 0x2a2a3e);

    this.add
      .text(GAME_WIDTH / 2, heroY - 60, '🐉', { fontSize: '48px' })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, heroY - 10, '고대 용의 그림', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, heroY + 18, '네모네모로 밝히고 · 잉크 덱을 쌓아라', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    // 파티 미니 슬롯
    const slotY = heroY + 58;
    const slotW = (GAME_WIDTH - 48 - 24) / 4;
    party.members.forEach((m, i) => {
      const x = 24 + i * (slotW + 8) + slotW / 2;
      this.add.rectangle(x, slotY, slotW, 44, 0x242438).setStrokeStyle(1, COLORS.accent);
      this.add
        .text(x, slotY - 6, m.name.slice(0, 2), {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#f0f0f5',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add
        .text(x, slotY + 12, m.primaryConcept, {
          fontFamily: 'sans-serif',
          fontSize: '9px',
          color: '#8888aa',
        })
        .setOrigin(0.5);
    });

    // 플레이 버튼
    const playY = heroY + 150;
    const playBtn = this.add
      .rectangle(GAME_WIDTH / 2, playY, GAME_WIDTH - 48, 56, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, playY, '▶  게임 시작', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    playBtn.on('pointerover', () => playBtn.setFillStyle(0x9b7fff));
    playBtn.on('pointerout', () => playBtn.setFillStyle(COLORS.accent));
    playBtn.on('pointerdown', () => this.scene.start('DifficultySelectScene'));

    // 서브 메뉴
    const subY = playY + 56;
    const teamBtn = this.add
      .rectangle(GAME_WIDTH / 2 - 80, subY, 140, 40, COLORS.panel)
      .setStrokeStyle(1, 0x555566)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2 - 80, subY, '팀 편성', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);
    teamBtn.on('pointerdown', () => this.scene.start('TeamScene'));

    this.add
      .rectangle(GAME_WIDTH / 2 + 80, subY, 140, 40, COLORS.panel)
      .setStrokeStyle(1, 0x555566);
    this.add
      .text(GAME_WIDTH / 2 + 80, subY, '이벤트', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    // 공지
    this.add
      .text(20, contentBottom - 80, '📢 튜토리얼 1×1부터 시작 · 가챠로 SSR 수집', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#555566',
      });
  }
}
