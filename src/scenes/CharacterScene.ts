import Phaser from 'phaser';
import { cardRepository } from '@modules/card';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { CHARACTER_ROSTER, getCharacterDef, type PlayerProfile } from '@modules/meta';
import { drawMobileShell } from '@ui/mobile-shell';

export class CharacterScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private listContainer!: Phaser.GameObjects.Container;
  private detailContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('CharacterScene');
  }

  create(): void {
    this.profile = this.registry.get('playerProfile') as PlayerProfile;
    drawMobileShell(this, '캐릭터', 'characters');

    this.add
      .text(GAME_WIDTH / 2, LAYOUT.CONTENT_TOP - 8, '탭하여 출전 캐릭터 변경', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);
    this.renderList();
  }

  private renderList(): void {
    this.listContainer.removeAll(true);
    if (this.detailContainer) {
      this.detailContainer.destroy();
      this.detailContainer = null;
    }

    const owned = new Set(this.profile.getOwnedCharacterIds());
    const sorted = [...CHARACTER_ROSTER].sort((a, b) => {
      const ao = owned.has(a.id) ? 0 : 1;
      const bo = owned.has(b.id) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return a.grade.localeCompare(b.grade);
    });

    let y = LAYOUT.CONTENT_TOP + 20;
    const rowW = GAME_WIDTH - 24;
    const selectedId = this.profile.getSelectedCharacterId();

    for (const ch of sorted) {
      if (y > LAYOUT.CONTENT_BOTTOM - 16) break;

      const isOwned = owned.has(ch.id);
      const isSelected = ch.id === selectedId;
      const row = this.add
        .rectangle(GAME_WIDTH / 2, y, rowW, 64, isSelected ? 0x32324a : isOwned ? 0x242438 : 0x14141f)
        .setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0xf5c842 : isOwned ? COLORS.accent : 0x333344)
        .setInteractive({ useHandCursor: isOwned });

      const badge = ch.grade === 'SSR' ? '★ SSR' : '◆ SR';
      const prefix = isSelected ? '⚔ ' : isOwned ? '' : '🔒 ';
      const name = this.add
        .text(20, y - 12, `${prefix}${ch.name}`, {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: isOwned ? '#f0f0f5' : '#555566',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      const meta = this.add
        .text(20, y + 12, `${badge} · ${ch.primaryConcept} · ${ch.tagline}`, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: isOwned ? '#8888aa' : '#444455',
        })
        .setOrigin(0, 0.5);

      if (isOwned) {
        row.on('pointerdown', () => {
          this.profile.setSelectedCharacter(ch.id);
          this.renderList();
        });

        const info = this.add
          .text(GAME_WIDTH - 36, y, 'ⓘ', {
            fontSize: '18px',
            color: '#8888aa',
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        info.on('pointerdown', (p: Phaser.Input.Pointer) => {
          p.event.stopPropagation();
          this.showDetail(ch.id);
        });
        this.listContainer.add(info);
      }

      this.listContainer.add([row, name, meta]);
      y += 72;
    }
  }

  private showDetail(characterId: string): void {
    const def = getCharacterDef(characterId);
    if (!def) return;

    if (this.detailContainer) this.detailContainer.destroy();
    this.detailContainer = this.add.container(0, 0).setDepth(50);

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setInteractive();
    this.detailContainer.add(overlay);

    const panelH = Math.min(520, LAYOUT.CONTENT_BOTTOM - LAYOUT.CONTENT_TOP - 20);
    const panelY = LAYOUT.CONTENT_TOP + panelH / 2 + 10;
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, panelY, GAME_WIDTH - 24, panelH, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    this.detailContainer.add(panel);

    const close = this.add
      .text(GAME_WIDTH - 28, LAYOUT.CONTENT_TOP + 16, '✕', {
        fontSize: '20px',
        color: '#8888aa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      this.detailContainer?.destroy();
      this.detailContainer = null;
    });
    this.detailContainer.add(close);

    const title = this.add
      .text(GAME_WIDTH / 2, LAYOUT.CONTENT_TOP + 36, def.name, {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.detailContainer.add(title);

    const detailMeta = this.add
      .text(GAME_WIDTH / 2, LAYOUT.CONTENT_TOP + 64, `${def.grade} · ${def.primaryConcept} · ${def.tagline}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);
    this.detailContainer.add(detailMeta);

    const uniqueTitle = this.add.text(24, LAYOUT.CONTENT_TOP + 96, '고유 · 전용 카드', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#f0f0f5',
      fontStyle: 'bold',
    });
    this.detailContainer.add(uniqueTitle);

    let cardY = LAYOUT.CONTENT_TOP + 124;
    for (const cardId of def.uniqueCardIds) {
      const card = cardRepository.getCardById(cardId);
      const cardOwned = this.profile.ownsCard(cardId);

      const row = this.add
        .rectangle(GAME_WIDTH / 2, cardY, GAME_WIDTH - 48, 52, 0x1a1a2e)
        .setStrokeStyle(1, cardOwned ? COLORS.accent : 0x444455);

      const cardName = this.add
        .text(36, cardY - 8, `${cardOwned ? '✓' : '○'} ${card?.name ?? cardId}`, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: cardOwned ? '#f0f0f5' : '#666680',
        })
        .setOrigin(0, 0.5);

      const cardMeta = this.add
        .text(36, cardY + 12, `${card?.conceptPrimary ?? def.primaryConcept} · ${card?.grade ?? '?'}`, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#8888aa',
        })
        .setOrigin(0, 0.5);

      this.detailContainer.add([row, cardName, cardMeta]);
      cardY += 60;
    }

    if (def.uniqueCardIds.length === 0) {
      const empty = this.add
        .text(GAME_WIDTH / 2, cardY, '등록된 고유 카드 없음', {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#555566',
        })
        .setOrigin(0.5);
      this.detailContainer.add(empty);
    }
  }
}
