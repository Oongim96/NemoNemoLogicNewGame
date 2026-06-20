import Phaser from 'phaser';
import { cardRepository } from '@modules/card';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { CHARACTER_DETAIL_TEXT } from '@modules/meta/domain/character-detail.data';
import { CHARACTER_ROSTER, getCharacterDef, type PlayerProfile } from '@modules/meta';
import { drawMobileShell } from '@ui/mobile-shell';
import { characterPortraitKey } from '@ui/collection-detail-art';
import {
  CollectionDetailOverlay,
  GRADE_BORDER,
} from '@ui/collection-detail-overlay';

export class CharacterScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private listContainer!: Phaser.GameObjects.Container;
  private detailOverlay: CollectionDetailOverlay | null = null;

  constructor() {
    super('CharacterScene');
  }

  create(): void {
    this.profile = this.registry.get('playerProfile') as PlayerProfile;
    drawMobileShell(this, '캐릭터', 'characters');

    this.add
      .text(GAME_WIDTH / 2, LAYOUT.CONTENT_TOP - 8, '탭하여 상세 · 출전 변경', {
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
    this.detailOverlay?.destroy();
    this.detailOverlay = null;

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
        .setInteractive({ useHandCursor: true });

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

      row.on('pointerdown', () => this.showDetail(ch.id));
      this.listContainer.add([row, name, meta]);
      y += 72;
    }
  }

  private showDetail(characterId: string): void {
    const def = getCharacterDef(characterId);
    if (!def) return;

    const isOwned = this.profile.ownsCharacter(characterId);
    const isSelected = this.profile.getSelectedCharacterId() === characterId;
    const borderColor = GRADE_BORDER[def.grade] ?? COLORS.accent;
    const detail = CHARACTER_DETAIL_TEXT[characterId];

    const conceptLine = def.secondaryConcept
      ? `${def.primaryConcept} · ${def.secondaryConcept}`
      : def.primaryConcept;

    const sections: { title: string; body: string; muted?: boolean }[] = [];

    if (isOwned && detail?.puzzle) {
      sections.push({ title: '퍼즐 패시브', body: detail.puzzle });
    }
    if (isOwned && detail?.battle) {
      sections.push({ title: '전투 패시브', body: detail.battle });
    }
    if (isOwned && detail?.ult) {
      sections.push({ title: '궁극기', body: detail.ult });
    }
    if (isOwned && !detail) {
      sections.push({ title: '패시브', body: '상세 정보 준비 중', muted: true });
    }
    if (!isOwned) {
      sections.push({
        title: '잠금',
        body: '미보유 캐릭터입니다.\n가챠에서 획득할 수 있습니다.',
        muted: true,
      });
    }

    const uniqueLines: string[] = [];
    for (const cardId of def.uniqueCardIds) {
      const card = cardRepository.getCardById(cardId);
      const mark = this.profile.ownsCard(cardId) ? '✓' : '○';
      uniqueLines.push(`${mark} ${card?.name ?? cardId}`);
    }
    if (uniqueLines.length > 0) {
      sections.push({
        title: '고유 · 전용 카드',
        body: isOwned ? uniqueLines.join('\n') : '???',
        muted: !isOwned,
      });
    }

    this.detailOverlay?.destroy();
    this.detailOverlay = new CollectionDetailOverlay(this, () => {
      this.detailOverlay = null;
    });

    this.detailOverlay.show({
      art: {
        kind: 'character',
        borderColor,
        conceptPrimary: def.primaryConcept,
        gradeLabel: def.grade,
        locked: !isOwned,
        textureKey: characterPortraitKey(characterId),
      },
      title: def.name,
      subtitle: def.tagline,
      chips: [def.grade, ...conceptLine.split(' · ')],
      borderColor,
      sections,
      footerLabel: isOwned ? (isSelected ? '출전 중' : '출전 캐릭터로 설정') : undefined,
      footerDisabled: !isOwned || isSelected,
      onFooter: isOwned
        ? () => {
            this.profile.setSelectedCharacter(characterId);
            this.renderList();
          }
        : undefined,
    });
  }
}
