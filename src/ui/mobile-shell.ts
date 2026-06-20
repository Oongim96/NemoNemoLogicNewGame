import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { getCharacterDef, type PlayerProfile } from '@modules/meta';

export type NavTab = 'home' | 'characters' | 'cards' | 'gacha' | 'settings';

const NAV_ITEMS: { id: NavTab; icon: string; label: string; scene: string; center?: boolean }[] = [
  { id: 'characters', icon: '👤', label: '캐릭', scene: 'CharacterScene' },
  { id: 'cards', icon: '🃏', label: '카드', scene: 'CardCollectionScene' },
  { id: 'home', icon: '⚔', label: '전투', scene: 'HubScene', center: true },
  { id: 'gacha', icon: '💎', label: '가챠', scene: 'GachaScene' },
  { id: 'settings', icon: '⚙', label: '설정', scene: 'SettingsScene' },
];

export function fillMobileBackground(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);
}

/** 로비형 상단 — 아바타 · 레벨 · 재화 */
export function drawLobbyTopBar(scene: Phaser.Scene): void {
  const profile = scene.registry.get('playerProfile') as PlayerProfile | undefined;
  const y = LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2;

  scene.add.rectangle(GAME_WIDTH / 2, y + LAYOUT.SAFE_TOP / 2, GAME_WIDTH, LAYOUT.TOP_BAR + LAYOUT.SAFE_TOP, 0x1a2418, 0.95);
  scene.add.rectangle(GAME_WIDTH / 2, LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR, GAME_WIDTH, 1, 0x3a4a3a);

  if (!profile) return;

  const char = getCharacterDef(profile.getSelectedCharacterId());
  scene.add.circle(52, y, 22, COLORS.panel).setStrokeStyle(2, COLORS.accent);
  scene.add.text(52, y, char?.name.slice(0, 1) ?? '?', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

  scene.add
    .text(84, y - 8, profile.getDisplayName(), {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#f0f0f5',
      fontStyle: 'bold',
    })
    .setOrigin(0, 0.5);
  scene.add
    .text(84, y + 10, `LV.${profile.getLevel()}`, {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#8888aa',
    })
    .setOrigin(0, 0.5);

  const gems = scene.add
    .text(GAME_WIDTH - 16, y - 6, `💎 ${formatCompact(profile.getGems())}`, {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#ffb3e0',
    })
    .setOrigin(1, 0.5);

  scene.add
    .text(GAME_WIDTH - 16, y + 12, `🪙 ${formatCompact(profile.getGold())}`, {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#ffd700',
    })
    .setOrigin(1, 0.5);

  void gems;
}

export function drawTopBar(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  const profile = scene.registry.get('playerProfile') as PlayerProfile | undefined;
  const y = LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2;

  scene.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, LAYOUT.TOP_BAR + LAYOUT.SAFE_TOP, COLORS.navBar);
  scene.add.rectangle(GAME_WIDTH / 2, LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR, GAME_WIDTH, 1, 0x2a2a3e);

  const titleText = scene.add
    .text(GAME_WIDTH / 2, y, title, {
      fontFamily: 'sans-serif',
      fontSize: '17px',
      color: '#f0f0f5',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  if (profile) {
    scene.add
      .text(GAME_WIDTH - 16, y, `💎 ${profile.getGems()}`, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffd700',
      })
      .setOrigin(1, 0.5);
  }

  return titleText;
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}K`;
  return String(n);
}

export function drawBottomNav(scene: Phaser.Scene, active: NavTab): void {
  const navH = LAYOUT.BOTTOM_NAV;
  const navY = GAME_HEIGHT - navH / 2;
  const tabW = GAME_WIDTH / NAV_ITEMS.length;

  scene.add.rectangle(GAME_WIDTH / 2, navY + 4, GAME_WIDTH, navH + 8, COLORS.navBar);
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - navH, GAME_WIDTH, 1, 0x2a2a3e);

  NAV_ITEMS.forEach((tab, i) => {
    const x = tabW * i + tabW / 2;
    const isActive = tab.id === active;
    const isCenter = tab.center === true;

    const btnY = isCenter ? navY - 14 : navY;
    const btnSize = isCenter ? 56 : tabW - 4;
    const btnH = isCenter ? 56 : navH;

    const hit = scene.add
      .rectangle(x, btnY, btnSize, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    if (isCenter) {
      scene.add
        .circle(x, btnY, 28, isActive ? 0xf5c842 : 0x3a3a50)
        .setStrokeStyle(isActive ? 3 : 2, isActive ? 0xffe082 : 0x555566);
      scene.add.text(x, btnY - 4, tab.icon, { fontSize: '22px' }).setOrigin(0.5);
    } else {
      scene.add.text(x, btnY - 10, tab.icon, { fontSize: '20px' }).setOrigin(0.5);
    }

    scene.add
      .text(x, isCenter ? btnY + 22 : btnY + 14, tab.label, {
        fontFamily: 'sans-serif',
        fontSize: isCenter ? '11px' : '10px',
        color: isActive ? '#f0f0f5' : '#666680',
        fontStyle: isActive ? 'bold' : 'normal',
      })
      .setOrigin(0.5);

    hit.on('pointerdown', () => {
      if (!isActive) scene.scene.start(tab.scene);
    });
  });
}

export function drawMobileShell(scene: Phaser.Scene, title: string, activeTab: NavTab): void {
  fillMobileBackground(scene);
  drawTopBar(scene, title);
  drawBottomNav(scene, activeTab);
}

export function drawLobbyShell(scene: Phaser.Scene): void {
  fillMobileBackground(scene);
  drawLobbyTopBar(scene);
  drawBottomNav(scene, 'home');
}

export function drawSubScreenHeader(
  scene: Phaser.Scene,
  title: string,
  onBack?: () => void,
): number {
  const barH = LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR;
  const barY = barH / 2;
  const centerY = LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2;

  scene.add.rectangle(GAME_WIDTH / 2, barY, GAME_WIDTH, barH, COLORS.navBar);
  scene.add.rectangle(GAME_WIDTH / 2, barH, GAME_WIDTH, 1, 0x2a2a3e);

  if (onBack) {
    const btn = scene.add
      .text(20, centerY, '←', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#7c5cff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onBack);
  }

  scene.add
    .text(GAME_WIDTH / 2, centerY, title, {
      fontFamily: 'sans-serif',
      fontSize: '17px',
      color: '#f0f0f5',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  const profile = scene.registry.get('playerProfile') as PlayerProfile | undefined;
  if (profile) {
    scene.add
      .text(GAME_WIDTH - 16, centerY - 8, `💎 ${formatCompact(profile.getGems())}`, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#ffb3e0',
      })
      .setOrigin(1, 0.5);
    scene.add
      .text(GAME_WIDTH - 16, centerY + 10, `🪙 ${formatCompact(profile.getGold())}`, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#ffd700',
      })
      .setOrigin(1, 0.5);
  }

  return barH + 8;
}

export function backButton(scene: Phaser.Scene, onBack: () => void): void {
  const y = LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2;
  const btn = scene.add
    .text(20, y, '←', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#7c5cff',
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  btn.on('pointerdown', onBack);
}

/** 전투 시작 버튼 (로비·스테이지 선택 공통) */
export function drawBattleStartButton(
  scene: Phaser.Scene,
  y: number,
  label: string,
  onClick: () => void,
): Phaser.GameObjects.Rectangle {
  const w = GAME_WIDTH - 48;
  const btn = scene.add
    .rectangle(GAME_WIDTH / 2, y, w, 52, 0xf5c842)
    .setStrokeStyle(2, 0xe6a800)
    .setInteractive({ useHandCursor: true });

  scene.add
    .text(GAME_WIDTH / 2, y, label, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#3a2800',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  btn.on('pointerover', () => btn.setFillStyle(0xffe082));
  btn.on('pointerout', () => btn.setFillStyle(0xf5c842));
  btn.on('pointerdown', onClick);

  return btn;
}
