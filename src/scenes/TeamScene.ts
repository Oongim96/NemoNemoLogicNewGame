import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { getCharacterDef, type PlayerProfile } from '@modules/meta';
import { backButton, fillMobileBackground } from '@ui/mobile-shell';

export class TeamScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private selectedSlot = 0;

  constructor() {
    super('TeamScene');
  }

  create(): void {
    this.profile = this.registry.get('playerProfile') as PlayerProfile;
    fillMobileBackground(this);
    backButton(this, () => this.scene.start('HubScene'));

    this.add
      .text(GAME_WIDTH / 2, LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2, '팀 편성', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, LAYOUT.CONTENT_TOP + 8, '슬롯 선택 → 캐릭터 탭으로 교체', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.render();
  }

  private render(): void {
    this.children.list
      .filter((c) => (c as Phaser.GameObjects.GameObject & { teamRow?: boolean }).teamRow)
      .forEach((c) => c.destroy());

    const slots = this.profile.getPartyMemberIds();
    const bench = this.profile.getOwnedCharacterIds();

    slots.forEach((id, slot) => {
      const def = getCharacterDef(id);
      const y = LAYOUT.CONTENT_TOP + 40 + slot * 68;
      const selected = slot === this.selectedSlot;

      const box = this.add
        .rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 24, 60, selected ? 0x32324a : 0x242438)
        .setStrokeStyle(2, selected ? COLORS.accent : 0x555566)
        .setInteractive({ useHandCursor: true });
      (box as Phaser.GameObjects.Rectangle & { teamRow?: boolean }).teamRow = true;

      box.on('pointerdown', () => {
        this.selectedSlot = slot;
        this.render();
      });

      const label = this.add
        .text(20, y, `슬롯 ${slot + 1}`, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#8888aa',
        })
        .setOrigin(0, 0.5);
      (label as Phaser.GameObjects.Text & { teamRow?: boolean }).teamRow = true;

      const name = this.add
        .text(20, y + 16, def ? `${def.name} · ${def.primaryConcept}` : id, {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: '#f0f0f5',
        })
        .setOrigin(0, 0.5);
      (name as Phaser.GameObjects.Text & { teamRow?: boolean }).teamRow = true;
    });

    let y = LAYOUT.CONTENT_TOP + 40 + 4 * 68 + 16;
    this.add
      .text(20, y, '보유 캐릭터', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#7c5cff',
      })
      .setOrigin(0, 0.5);
    (this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text & { teamRow?: boolean }).teamRow =
      true;

    y += 28;
    bench.forEach((id) => {
      const def = getCharacterDef(id);
      if (!def) return;
      if (y > LAYOUT.CONTENT_BOTTOM - 20) return;

      const btn = this.add
        .rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 24, 44, COLORS.panel)
        .setStrokeStyle(1, 0x555566)
        .setInteractive({ useHandCursor: true });
      (btn as Phaser.GameObjects.Rectangle & { teamRow?: boolean }).teamRow = true;

      btn.on('pointerdown', () => {
        this.profile.setPartySlot(this.selectedSlot, id);
        this.render();
      });

      const txt = this.add
        .text(20, y, def.name, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#f0f0f5',
        })
        .setOrigin(0, 0.5);
      (txt as Phaser.GameObjects.Text & { teamRow?: boolean }).teamRow = true;

      y += 50;
    });
  }
}
