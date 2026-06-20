import Phaser from 'phaser';
import type { Concept } from '@modules/card';
import type { BattlePlaybackEvent } from '@modules/effects/battle/battle-playback.types';
import { GAME_WIDTH } from '@app/game.config';

export const BATTLE_LAYOUT = {
  arenaTop: 44,
  arenaHeight: 360,
  logTop: 412,
  logHeight: 300,
  footerY: 768,
} as const;

const CONCEPT_COLOR: Record<string, number> = {
  잉크: 0x7c5cff,
  불꽃: 0xff5533,
  달빛: 0xaaccff,
  철벽: 0x8899aa,
  행운: 0xffd700,
  힌트: 0x66ccaa,
  격자: 0x44aa88,
  저주: 0x9933cc,
};

const CONCEPT_ICON: Record<string, string> = {
  잉크: '🖌',
  불꽃: '🔥',
  달빛: '🌙',
  철벽: '🛡',
  행운: '🎲',
  힌트: '🔍',
  격자: '▦',
  저주: '💀',
};

export class AutoBattleArena {
  private hero!: Phaser.GameObjects.Image;
  private enemy!: Phaser.GameObjects.Image;
  private enemyHpFill!: Phaser.GameObjects.Rectangle;
  private partyHpFill!: Phaser.GameObjects.Rectangle;
  private inkText!: Phaser.GameObjects.Text;
  private turnBanner!: Phaser.GameObjects.Text;
  private dmgText!: Phaser.GameObjects.Text;
  private cardSprite: Phaser.GameObjects.Container | null = null;
  private particles: Phaser.GameObjects.Arc[] = [];

  private enemyHp = 1;
  private enemyMaxHp = 1;
  private partyHp = 10;
  private partyMaxHp = 10;

  private readonly heroX = 88;
  private readonly enemyX = GAME_WIDTH - 88;
  private readonly floorY: number;

  constructor(
    private scene: Phaser.Scene,
    arenaCenterY: number,
  ) {
    this.floorY = arenaCenterY + 72;
    this.createTextures();
    this.drawBackground(arenaCenterY);
    this.createActors(arenaCenterY);
    this.createHud(arenaCenterY);
  }

  private createTextures(): void {
    if (this.scene.textures.exists('battle_hero')) return;

    const g = this.scene.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x7c5cff, 1);
    g.fillCircle(28, 32, 24);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(20, 26, 5);
    g.fillCircle(36, 26, 5);
    g.fillStyle(0x5a3fd9, 1);
    g.fillRoundedRect(14, 44, 28, 18, 6);
    g.generateTexture('battle_hero', 56, 64);
    g.clear();

    g.fillStyle(0x8b2942, 1);
    g.fillEllipse(40, 48, 72, 56);
    g.fillStyle(0xe85d5d, 1);
    g.fillCircle(52, 28, 22);
    g.fillStyle(0xffcc44, 1);
    g.fillCircle(44, 24, 6);
    g.fillCircle(60, 24, 6);
    g.fillStyle(0x3a1520, 1);
    g.fillTriangle(52, 34, 46, 42, 58, 42);
    g.fillStyle(0x662233, 1);
    g.fillTriangle(20, 36, 8, 20, 24, 24);
    g.fillTriangle(84, 36, 96, 20, 80, 24);
    g.generateTexture('battle_enemy', 104, 72);
    g.clear();

    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 100, 56, 8);
    g.generateTexture('battle_card', 100, 56);
    g.destroy();
  }

  private drawBackground(_cy: number): void {
    const top = BATTLE_LAYOUT.arenaTop;
    const h = BATTLE_LAYOUT.arenaHeight;

    this.scene.add.rectangle(GAME_WIDTH / 2, top + h / 2, GAME_WIDTH, h, 0x12121f);
    this.scene.add.rectangle(GAME_WIDTH / 2, top + h / 2, GAME_WIDTH - 24, h - 8, 0x1a1a2e).setStrokeStyle(1, 0x2a2a44);

    const grad = this.scene.add.graphics();
    grad.fillGradientStyle(0x2a1a4a, 0x2a1a4a, 0x0d0d14, 0x0d0d14, 0.35);
    grad.fillRect(12, top + 4, GAME_WIDTH - 24, h - 12);

    this.scene.add.rectangle(GAME_WIDTH / 2, this.floorY + 8, GAME_WIDTH - 48, 4, 0x2a2a40);
  }

  private createActors(_cy: number): void {
    this.hero = this.scene.add.image(this.heroX, this.floorY - 8, 'battle_hero').setOrigin(0.5, 1);
    this.enemy = this.scene.add.image(this.enemyX, this.floorY - 4, 'battle_enemy').setOrigin(0.5, 1);

    this.hero.setScale(1.1);
    this.enemy.setScale(1);
  }

  private createHud(cy: number): void {
    const barW = 120;
    const top = BATTLE_LAYOUT.arenaTop + 12;

    this.scene.add.text(this.heroX, top, '아군', { fontSize: '10px', color: '#8888aa' }).setOrigin(0.5);
    this.scene.add.rectangle(this.heroX, top + 14, barW, 8, 0x2a2a40);
    this.partyHpFill = this.scene.add.rectangle(this.heroX - barW / 2, top + 14, barW, 8, 0x3dd68c).setOrigin(0, 0.5);

    this.scene.add.text(this.enemyX, top, '적', { fontSize: '10px', color: '#8888aa' }).setOrigin(0.5);
    this.scene.add.rectangle(this.enemyX, top + 14, barW, 8, 0x2a2a40);
    this.enemyHpFill = this.scene.add.rectangle(this.enemyX - barW / 2, top + 14, barW, 8, 0xe85d5d).setOrigin(0, 0.5);

    this.inkText = this.scene.add
      .text(this.heroX, top + 32, '잉크 0', { fontSize: '11px', color: '#7c5cff', fontStyle: 'bold' })
      .setOrigin(0.5);

    this.turnBanner = this.scene.add
      .text(GAME_WIDTH / 2, cy - 20, '', { fontSize: '16px', color: '#f5c842', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setAlpha(0);

    this.dmgText = this.scene.add
      .text(this.enemyX, cy - 40, '', { fontSize: '22px', color: '#ff8866', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setAlpha(0);
  }

  setInitialState(enemyHp: number, enemyMaxHp: number, partyHp: number, ink: number): void {
    this.enemyHp = enemyHp;
    this.enemyMaxHp = enemyMaxHp;
    this.partyHp = partyHp;
    this.refreshBars();
    this.inkText.setText(`잉크 ${ink}`);
  }

  private refreshBars(): void {
    const barW = 120;
    this.enemyHpFill.width = barW * (this.enemyHp / this.enemyMaxHp);
    this.partyHpFill.width = barW * (this.partyHp / this.partyMaxHp);
  }

  playEvent(ev: BattlePlaybackEvent, onDone: () => void): void {
    if (ev.enemyHp !== undefined) this.enemyHp = ev.enemyHp;
    if (ev.enemyMaxHp !== undefined) this.enemyMaxHp = ev.enemyMaxHp;
    if (ev.partyHp !== undefined) this.partyHp = ev.partyHp;
    if (ev.inkStack !== undefined) this.inkText.setText(`잉크 ${ev.inkStack}`);

    switch (ev.kind) {
      case 'turn_start':
        this.showTurnBanner(ev.text, onDone);
        break;
      case 'card':
        this.animateCard(ev, onDone);
        break;
      case 'damage':
        this.animateDamage(ev, onDone);
        break;
      case 'heal':
        this.animateHeal(onDone);
        break;
      case 'enemy_hit':
        this.animateEnemyHit(onDone);
        break;
      case 'ink':
      case 'threshold':
        this.flashConcept(0x7c5cff, onDone);
        break;
      case 'victory':
        this.animateVictory(onDone);
        break;
      case 'defeat':
        this.animateDefeat(onDone);
        break;
      default:
        onDone();
    }
  }

  private showTurnBanner(text: string, onDone: () => void): void {
    this.turnBanner.setText(text).setAlpha(1).setScale(0.8);
    this.scene.tweens.add({
      targets: this.turnBanner,
      scale: 1,
      alpha: 0,
      duration: 600,
      delay: 200,
      onComplete: onDone,
    });
  }

  private animateCard(ev: BattlePlaybackEvent, onDone: () => void): void {
    const color = CONCEPT_COLOR[ev.concept ?? '잉크'] ?? 0x7c5cff;
    const icon = CONCEPT_ICON[ev.concept ?? '잉크'] ?? '✦';

    this.cardSprite?.destroy();
    const container = this.scene.add.container(this.heroX + 20, this.floorY - 60);
    const bg = this.scene.add.rectangle(0, 0, 96, 52, color).setStrokeStyle(2, 0xffffff);
    const label = this.scene.add
      .text(0, -6, icon, { fontSize: '18px' })
      .setOrigin(0.5);
    const name = this.scene.add
      .text(0, 14, ev.cardName ?? '', { fontSize: '10px', color: '#fff', fontStyle: 'bold' })
      .setOrigin(0.5);
    container.add([bg, label, name]);
    this.cardSprite = container;

    this.scene.tweens.add({
      targets: container,
      x: this.enemyX - 30,
      y: this.floorY - 80,
      scale: 1.15,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.spawnBurst(this.enemyX, this.floorY - 50, color);
        this.scene.tweens.add({
          targets: this.enemy,
          x: this.enemyX + 6,
          duration: 40,
          yoyo: true,
          repeat: 2,
        });
        this.scene.tweens.add({
          targets: container,
          alpha: 0,
          scale: 0.6,
          duration: 180,
          onComplete: () => {
            container.destroy();
            this.cardSprite = null;
            onDone();
          },
        });
      },
    });
  }

  private animateDamage(ev: BattlePlaybackEvent, onDone: () => void): void {
    this.refreshBars();
    const dmg = ev.value ?? 0;
    this.dmgText.setText(`-${dmg}`).setAlpha(1).setY(this.floorY - 90);

    this.scene.tweens.add({
      targets: this.dmgText,
      y: this.floorY - 130,
      alpha: 0,
      duration: 700,
    });

    this.scene.tweens.add({
      targets: this.enemy,
      tint: 0xffffff,
      duration: 80,
      yoyo: true,
      repeat: 1,
      onComplete: () => this.enemy.clearTint(),
    });

    this.spawnBurst(this.enemyX, this.floorY - 40, 0xff6644);
    this.scene.time.delayedCall(400, onDone);
  }

  private animateHeal(onDone: () => void): void {
    this.refreshBars();
    this.spawnBurst(this.heroX, this.floorY - 40, 0x3dd68c, 8);
    this.scene.tweens.add({
      targets: this.hero,
      scale: 1.2,
      duration: 120,
      yoyo: true,
      onComplete: onDone,
    });
  }

  private animateEnemyHit(onDone: () => void): void {
    this.refreshBars();
    this.scene.tweens.add({
      targets: this.hero,
      x: this.heroX - 10,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.hero.setX(this.heroX),
    });
    this.scene.cameras.main.shake(80, 0.004);
    this.scene.time.delayedCall(350, onDone);
  }

  private animateVictory(onDone: () => void): void {
    this.scene.tweens.add({
      targets: this.enemy,
      alpha: 0,
      scale: 0.5,
      angle: 15,
      duration: 500,
    });
    this.spawnBurst(this.enemyX, this.floorY - 50, 0xffd700, 16);
    this.scene.time.delayedCall(500, onDone);
  }

  private animateDefeat(onDone: () => void): void {
    this.scene.tweens.add({
      targets: this.hero,
      alpha: 0.4,
      angle: -10,
      duration: 400,
    });
    this.scene.time.delayedCall(400, onDone);
  }

  private flashConcept(color: number, onDone: () => void): void {
    this.spawnBurst(GAME_WIDTH / 2, this.floorY - 60, color, 6);
    this.scene.time.delayedCall(250, onDone);
  }

  private spawnBurst(x: number, y: number, color: number, count = 10): void {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.circle(x, y, 3 + Math.random() * 4, color, 0.9);
      this.particles.push(p);
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 50;
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 350 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }
}

export class AutoBattleLog {
  private lines: string[] = [];
  private text!: Phaser.GameObjects.Text;
  private scrollRoot!: Phaser.GameObjects.Container;
  private maskShape!: Phaser.GameObjects.Rectangle;
  private scrollZone!: Phaser.GameObjects.Rectangle;
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;
  private scrollOffset = 0;
  private maxScroll = 0;
  private scrollDragStart: { y: number; offset: number } | null = null;
  private thumbDragStart: { y: number; offset: number } | null = null;
  private stickToBottom = true;
  private readonly top: number;
  private readonly h: number;
  private readonly padX = 24;
  private readonly trackX: number;
  private readonly trackTop: number;
  private readonly trackH: number;
  private readonly thumbW = 4;
  private readonly thumbMinH = 28;
  private pointerMoveHandler = (p: Phaser.Input.Pointer) => this.onPointerMove(p);
  private pointerUpHandler = () => this.onPointerUp();

  constructor(private scene: Phaser.Scene) {
    this.top = BATTLE_LAYOUT.logTop;
    this.h = BATTLE_LAYOUT.logHeight;
    this.trackX = GAME_WIDTH - 14;
    this.trackTop = this.top + 6;
    this.trackH = this.h - 12;

    this.scene.add.text(20, this.top - 18, '전투 로그', {
      fontSize: '12px',
      color: '#8888aa',
      fontStyle: 'bold',
    });

    this.scene.add
      .rectangle(GAME_WIDTH / 2, this.top + this.h / 2, GAME_WIDTH - 24, this.h, 0x0a0a12, 0.95)
      .setStrokeStyle(1, 0x2a2a44);

    this.scrollTrack = this.scene.add
      .rectangle(this.trackX, this.trackTop + this.trackH / 2, this.thumbW, this.trackH, 0x2a2a40, 0.9);

    this.scrollThumb = this.scene.add
      .rectangle(this.trackX, this.trackTop + this.thumbMinH / 2, this.thumbW, this.thumbMinH, 0x7c5cff, 0.85)
      .setInteractive({ useHandCursor: true });

    this.scrollThumb.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.thumbDragStart = { y: p.y, offset: this.scrollOffset };
      this.stickToBottom = false;
    });

    this.maskShape = this.scene.add
      .rectangle(GAME_WIDTH / 2, this.top + this.h / 2, GAME_WIDTH - 28, this.h - 12, 0xffffff, 0)
      .setVisible(false);
    const mask = this.maskShape.createGeometryMask();

    this.scrollRoot = this.scene.add.container(this.padX, this.top + 8);
    this.scrollRoot.setMask(mask);

    this.text = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaacc',
      lineSpacing: 5,
      wordWrap: { width: GAME_WIDTH - 56 },
    });
    this.scrollRoot.add(this.text);

    this.scrollZone = this.scene.add
      .rectangle(GAME_WIDTH / 2 - 8, this.top + this.h / 2, GAME_WIDTH - 36, this.h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.scrollZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.scrollDragStart = { y: p.y, offset: this.scrollOffset };
      this.stickToBottom = false;
    });

    this.scene.input.on('pointermove', this.pointerMoveHandler);
    this.scene.input.on('pointerup', this.pointerUpHandler);
  }

  destroy(): void {
    this.scene.input.off('pointermove', this.pointerMoveHandler);
    this.scene.input.off('pointerup', this.pointerUpHandler);
    this.scrollRoot?.destroy();
    this.maskShape?.destroy();
    this.scrollZone?.destroy();
    this.scrollTrack?.destroy();
    this.scrollThumb?.destroy();
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (this.thumbDragStart && this.maxScroll > 0) {
      const trackRange = this.trackH - this.scrollThumb.height;
      const dy = p.y - this.thumbDragStart.y;
      const ratio = trackRange > 0 ? dy / trackRange : 0;
      this.setScroll(this.thumbDragStart.offset + ratio * this.maxScroll);
      return;
    }
    if (!this.scrollDragStart || this.maxScroll <= 0) return;
    const dy = p.y - this.scrollDragStart.y;
    this.setScroll(this.scrollDragStart.offset - dy);
  }

  private onPointerUp(): void {
    this.scrollDragStart = null;
    this.thumbDragStart = null;
  }

  private setScroll(offset: number): void {
    this.scrollOffset = Phaser.Math.Clamp(offset, 0, this.maxScroll);
    this.text.setY(-this.scrollOffset);
    this.updateScrollbar();
  }

  private updateScrollbar(): void {
    if (this.maxScroll <= 0) {
      this.scrollTrack.setVisible(false);
      this.scrollThumb.setVisible(false);
      return;
    }
    this.scrollTrack.setVisible(true);
    this.scrollThumb.setVisible(true);

    const visible = this.h - 16;
    const contentH = this.text.height;
    const thumbH = Math.max(this.thumbMinH, (visible / contentH) * this.trackH);
    const trackRange = this.trackH - thumbH;
    const ratio = this.maxScroll > 0 ? this.scrollOffset / this.maxScroll : 0;
    const thumbY = this.trackTop + thumbH / 2 + ratio * trackRange;

    this.scrollThumb.setSize(this.thumbW, thumbH);
    this.scrollThumb.setY(thumbY);
  }

  private refreshScrollBounds(): void {
    const visible = this.h - 16;
    this.maxScroll = Math.max(0, this.text.height - visible);
    if (this.stickToBottom) {
      this.setScroll(this.maxScroll);
    } else {
      this.setScroll(this.scrollOffset);
    }
  }

  append(ev: BattlePlaybackEvent): void {
    const prefix =
      ev.phase === 'enemy' ? '🔴' : ev.kind === 'card' ? '🃏' : ev.kind === 'damage' ? '💥' : '▸';
    const line = `[T${ev.turn || '-'}] ${prefix} ${ev.text}`;
    this.lines.push(line);
    this.text.setText(this.lines.join('\n'));
    this.refreshScrollBounds();
  }

  appendAll(events: BattlePlaybackEvent[]): void {
    for (const ev of events) {
      const prefix =
        ev.phase === 'enemy' ? '🔴' : ev.kind === 'card' ? '🃏' : ev.kind === 'damage' ? '💥' : '▸';
      this.lines.push(`[T${ev.turn || '-'}] ${prefix} ${ev.text}`);
    }
    this.text.setText(this.lines.join('\n'));
    this.stickToBottom = false;
    this.refreshScrollBounds();
  }
}

export function conceptColor(concept?: Concept): number {
  return CONCEPT_COLOR[concept ?? '잉크'] ?? 0x7c5cff;
}
