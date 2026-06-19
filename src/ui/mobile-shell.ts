import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '@app/game.config';
import type { PlayerProfile } from '@modules/meta';

export type NavTab = 'home' | 'characters' | 'cards' | 'gacha' | 'settings';

const NAV_ITEMS: { id: NavTab; icon: string; label: string; scene: string }[] = [
  { id: 'home', icon: '🏠', label: '홈', scene: 'HubScene' },
  { id: 'characters', icon: '👤', label: '캐릭', scene: 'CharacterScene' },
  { id: 'cards', icon: '🃏', label: '카드', scene: 'CardCollectionScene' },
  { id: 'gacha', icon: '💎', label: '가챠', scene: 'GachaScene' },
  { id: 'settings', icon: '⚙', label: '설정', scene: 'SettingsScene' },
];

export function fillMobileBackground(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);
}

export function drawTopBar(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  const profile = scene.registry.get('playerProfile') as PlayerProfile | undefined;
  const y = LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2;

  scene.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, LAYOUT.TOP_BAR + LAYOUT.SAFE_TOP, COLORS.navBar);
  scene.add.rectangle(GAME_WIDTH / 2, LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR, GAME_WIDTH, 1, 0x2a2a3e);

  const titleText = scene.add
    .text(16, y, title, {
      fontFamily: 'sans-serif',
      fontSize: '17px',
      color: '#f0f0f5',
      fontStyle: 'bold',
    })
    .setOrigin(0, 0.5);

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

export function drawBottomNav(scene: Phaser.Scene, active: NavTab): void {
  const navY = GAME_HEIGHT - LAYOUT.BOTTOM_NAV / 2;
  const tabW = GAME_WIDTH / NAV_ITEMS.length;

  scene.add.rectangle(GAME_WIDTH / 2, navY, GAME_WIDTH, LAYOUT.BOTTOM_NAV, COLORS.navBar);
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - LAYOUT.BOTTOM_NAV, GAME_WIDTH, 1, 0x2a2a3e);

  NAV_ITEMS.forEach((tab, i) => {
    const x = tabW * i + tabW / 2;
    const isActive = tab.id === active;
    const color = isActive ? '#f0f0f5' : '#666680';

    const hit = scene.add
      .rectangle(x, navY, tabW, LAYOUT.BOTTOM_NAV, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    scene.add.text(x, navY - 10, tab.icon, { fontSize: '20px' }).setOrigin(0.5);
    scene.add
      .text(x, navY + 14, tab.label, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color,
        fontStyle: isActive ? 'bold' : 'normal',
      })
      .setOrigin(0.5);

    if (isActive) {
      scene.add.rectangle(x, GAME_HEIGHT - LAYOUT.BOTTOM_NAV + 2, tabW - 8, 3, COLORS.navActive);
    }

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

export function backButton(scene: Phaser.Scene, onBack: () => void): void {
  const y = LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2;
  const btn = scene.add
    .text(12, y, '←', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#7c5cff',
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  btn.on('pointerdown', onBack);
}
