import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { CHARACTER_ROSTER, getCharacterDef, type PlayerProfile } from '@modules/meta';
import { drawMobileShell } from '@ui/mobile-shell';

export class GachaScene extends Phaser.Scene {
  private resultText!: Phaser.GameObjects.Text;

  constructor() {
    super('GachaScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    drawMobileShell(this, '가챠', 'gacha');

    const bannerY = LAYOUT.CONTENT_TOP + 100;
    this.add
      .rectangle(GAME_WIDTH / 2, bannerY, GAME_WIDTH - 32, 200, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);

    this.add
      .text(GAME_WIDTH / 2, bannerY - 70, '✨ 한정 배너', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#7c5cff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const owned = profile.getOwnedCharacterIds().length;
    this.add
      .text(GAME_WIDTH / 2, bannerY - 40, `수집 ${owned}/${CHARACTER_ROSTER.length} · SSR 15%`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.resultText = this.add
      .text(GAME_WIDTH / 2, bannerY, '소환 결과', {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#f0f0f5',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 80 },
      })
      .setOrigin(0.5);

    const btnY = bannerY + 130;
    this.makePullBtn(GAME_WIDTH / 2, btnY - 28, '1회 소환 (100💎)', () => this.pull(profile));
    this.makePullBtn(GAME_WIDTH / 2, btnY + 28, '10회 소환 (900💎)', () => this.pullTen(profile));
  }

  private makePullBtn(x: number, y: number, label: string, onClick: () => void): void {
    const btn = this.add
      .rectangle(x, y, GAME_WIDTH - 48, 44, COLORS.accent)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: '15px', color: '#fff' })
      .setOrigin(0.5);
    btn.on('pointerdown', onClick);
  }

  private pull(profile: PlayerProfile): void {
    const result = profile.pullGacha();
    if (!result) {
      this.resultText.setText(profile.getGems() < 100 ? '💎 부족' : '전원 보유 — 💎 30 환급');
      return;
    }
    const def = getCharacterDef(result.characterId);
    this.resultText.setText(`${result.grade}!\n${def?.name}\n${def?.tagline ?? ''}`);
  }

  private pullTen(profile: PlayerProfile): void {
    const results = profile.pullTenGacha();
    if (results.length === 0) {
      this.resultText.setText('💎 부족 (900 필요)');
      return;
    }
    const lines = results.map((r) => getCharacterDef(r.characterId)?.name ?? r.characterId);
    this.resultText.setText(lines.join('\n'));
  }
}
