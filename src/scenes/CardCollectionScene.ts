import Phaser from 'phaser';
import { buildCardStrategyTags, cardRepository } from '@modules/card';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import type { PlayerProfile } from '@modules/meta';
import { drawMobileShell } from '@ui/mobile-shell';
import { cardArtKey } from '@ui/collection-detail-art';
import { buildCardDetailSections } from '@ui/card-detail.util';
import {
  CARD_GRADE_KO,
  CollectionDetailOverlay,
  GRADE_BORDER,
} from '@ui/collection-detail-overlay';

export class CardCollectionScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private listContainer!: Phaser.GameObjects.Container;
  private countText!: Phaser.GameObjects.Text;
  private detailOverlay: CollectionDetailOverlay | null = null;

  constructor() {
    super('CardCollectionScene');
  }

  create(): void {
    this.profile = this.registry.get('playerProfile') as PlayerProfile;
    drawMobileShell(this, '카드 도감', 'cards');

    this.add
      .text(GAME_WIDTH / 2, LAYOUT.CONTENT_TOP - 8, '탭하여 상세', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.countText = this.add
      .text(GAME_WIDTH - 16, LAYOUT.CONTENT_TOP + 4, '', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
      })
      .setOrigin(1, 0);

    this.listContainer = this.add.container(0, 0);
    this.renderList();
  }

  private renderList(): void {
    this.listContainer.removeAll(true);
    this.detailOverlay?.destroy();
    this.detailOverlay = null;

    const owned = new Set(this.profile.getOwnedCardIds());
    const all = cardRepository.getAllCards().filter((c) => c.enabled && c.draftWeight > 0);
    const sorted = [...all].sort((a, b) => {
      const ao = owned.has(a.cardId) ? 0 : 1;
      const bo = owned.has(b.cardId) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });

    this.countText.setText(`${sorted.filter((c) => owned.has(c.cardId)).length}/${all.length}`);

    let y = LAYOUT.CONTENT_TOP + 28;
    const rowW = GAME_WIDTH - 24;
    const maxY = LAYOUT.CONTENT_BOTTOM - 8;

    for (const card of sorted) {
      if (y > maxY) break;
      const isOwned = owned.has(card.cardId);
      const gradeColor = GRADE_BORDER[card.grade] ?? COLORS.accent;

      const row = this.add
        .rectangle(GAME_WIDTH / 2, y, rowW, 56, isOwned ? 0x242438 : 0x14141f)
        .setStrokeStyle(2, isOwned ? gradeColor : 0x333344)
        .setInteractive({ useHandCursor: true });

      const name = this.add
        .text(20, y - 10, `${isOwned ? '✓' : '○'} ${card.name}`, {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: isOwned ? '#f0f0f5' : '#555566',
          fontStyle: isOwned ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);

      const meta = this.add
        .text(20, y + 12, `${card.conceptPrimary} · ${CARD_GRADE_KO[card.grade] ?? card.grade}`, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: isOwned ? '#8888aa' : '#444455',
        })
        .setOrigin(0, 0.5);

      row.on('pointerdown', () => this.showDetail(card.cardId));
      this.listContainer.add([row, name, meta]);
      y += 64;
    }
  }

  private showDetail(cardId: string): void {
    const card = cardRepository.getCardById(cardId);
    if (!card) return;

    const isOwned = this.profile.ownsCard(cardId);
    const borderColor = GRADE_BORDER[card.grade] ?? COLORS.accent;
    const gradeLabel = CARD_GRADE_KO[card.grade] ?? card.grade;
    const conceptLine = card.conceptSecondary
      ? `${card.conceptPrimary} · ${card.conceptSecondary}`
      : card.conceptPrimary;

    const sections: { title: string; body: string; muted?: boolean }[] = [];

    if (isOwned) {
      sections.push(...buildCardDetailSections(card));
    } else {
      sections.push({
        title: '???',
        body: '미획득 카드입니다.\n소환 또는 전투 보상으로 획득할 수 있습니다.',
        muted: true,
      });
    }

    this.detailOverlay?.destroy();
    this.detailOverlay = new CollectionDetailOverlay(this, () => {
      this.detailOverlay = null;
    });

    this.detailOverlay.show({
      art: {
        kind: 'card',
        borderColor: isOwned ? borderColor : 0x444455,
        conceptPrimary: card.conceptPrimary,
        gradeLabel,
        locked: !isOwned,
        textureKey: cardArtKey(cardId),
      },
      title: isOwned ? card.name : '???',
      subtitle: isOwned ? conceptLine : '미획득',
      chips: buildCardStrategyTags(card),
      borderColor: isOwned ? borderColor : 0x444455,
      sections,
    });
  }
}
