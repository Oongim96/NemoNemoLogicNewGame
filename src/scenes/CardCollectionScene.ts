import Phaser from 'phaser';
import { cardRepository } from '@modules/card';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import type { PlayerProfile } from '@modules/meta';
import { drawMobileShell } from '@ui/mobile-shell';

export class CardCollectionScene extends Phaser.Scene {
  constructor() {
    super('CardCollectionScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    drawMobileShell(this, '카드 도감', 'cards');

    const owned = new Set(profile.getOwnedCardIds());
    const all = cardRepository.getAllCards();
    const sorted = [...all].sort((a, b) => {
      const ao = owned.has(a.cardId) ? 0 : 1;
      const bo = owned.has(b.cardId) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });

    const ownedCount = sorted.filter((c) => owned.has(c.cardId)).length;
    this.add
      .text(GAME_WIDTH - 16, LAYOUT.CONTENT_TOP + 4, `${ownedCount}/${all.length}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(1, 0);

    let y = LAYOUT.CONTENT_TOP + 28;
    const rowW = GAME_WIDTH - 24;
    const maxY = LAYOUT.CONTENT_BOTTOM - 8;

    for (const card of sorted) {
      if (y > maxY) break;
      const isOwned = owned.has(card.cardId);

      this.add
        .rectangle(GAME_WIDTH / 2, y, rowW, 56, isOwned ? 0x242438 : 0x14141f)
        .setStrokeStyle(1, isOwned ? COLORS.accent : 0x333344);

      this.add
        .text(20, y - 10, `${isOwned ? '✓' : '○'} ${card.name}`, {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: isOwned ? '#f0f0f5' : '#555566',
          fontStyle: isOwned ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);

      this.add
        .text(20, y + 12, `${card.conceptPrimary} · ${card.grade}`, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: isOwned ? '#8888aa' : '#444455',
        })
        .setOrigin(0, 0.5);

      y += 64;
    }
  }
}
