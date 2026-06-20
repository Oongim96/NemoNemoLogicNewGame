import Phaser from 'phaser';
import type { InkCard } from '@modules/card';
import { GAME_WIDTH } from '@app/game.config';
import {
  buildFormationPeekFace,
  buildInkCardFace,
  computeSpreadStripPositions,
  computeStripCardMetrics,
  inkCardFaceFromCard,
  spreadStripContentWidth,
  type StripCardMetrics,
} from '@ui/ink-card-face';

const SCROLLBAR_H = 22;
const LIFT_Y = -88;
const FOCUS_GLOW = 0x5ce1e6;

interface StripSlotView {
  slot: number;
  container: Phaser.GameObjects.Container;
  peekFace: Phaser.GameObjects.Container;
  fullFace: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  glow: Phaser.GameObjects.Rectangle;
  selectRing: Phaser.GameObjects.Rectangle;
  hitZone: Phaser.GameObjects.Rectangle;
  spreadX: number;
}

export class BattleFormationBoard {
  private order: number[] = [];
  private cards: InkCard[] = [];
  private focusSlot = 0;
  private slotViews: StripSlotView[] = [];
  private metrics!: StripCardMetrics;
  private hintText!: Phaser.GameObjects.Text;
  private handRoot!: Phaser.GameObjects.Container;
  private scrollRoot!: Phaser.GameObjects.Container;
  private maskShape!: Phaser.GameObjects.Rectangle;
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;
  private scrollZone!: Phaser.GameObjects.Rectangle;
  private scrollOffset = 0;
  private scrollAnim = { offset: 0 };
  private maxScroll = 0;
  private scrollDragStart: { x: number; offset: number } | null = null;
  private thumbDragStart: { x: number; offset: number } | null = null;
  private scrollTween: Phaser.Tweens.Tween | null = null;
  private cardDrag: {
    slot: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    dragged: boolean;
  } | null = null;
  private pointerMoveHandler = (p: Phaser.Input.Pointer) => this.onPointerMove(p);
  private pointerUpHandler = (p: Phaser.Input.Pointer) => this.onPointerUp(p);
  private wheelHandler = (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ) => this.onWheel(deltaY);
  private readonly cardAreaBottom: number;
  private readonly trackLeft = 16;
  private readonly trackW = GAME_WIDTH - 32;
  private readonly trackY: number;
  private readonly thumbH = 4;
  private readonly thumbMinW = 36;

  constructor(
    private scene: Phaser.Scene,
    private areaTop: number,
    areaBottom: number,
    private onOrderChange: (order: number[]) => void,
    private onCardDetail?: (card: InkCard) => void,
  ) {
    this.cardAreaBottom = areaBottom - SCROLLBAR_H;
    this.trackY = areaBottom - SCROLLBAR_H / 2 - 2;

    scene.input.on('pointermove', this.pointerMoveHandler);
    scene.input.on('pointerup', this.pointerUpHandler);
    scene.input.on('wheel', this.wheelHandler);
  }

  build(cards: InkCard[], order: number[]): void {
    this.clear();
    this.cards = [...cards];
    this.order = [...order];
    this.focusSlot = 0;

    const area = { top: 0, bottom: this.cardAreaBottom - this.areaTop };
    this.metrics = computeStripCardMetrics(area);

    this.hintText = this.scene.add
      .text(GAME_WIDTH / 2, this.areaTop + 8, '← 발동 순서 · 좌우 스크롤 · 가운데 카드 펼침 · 드래그=순서', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#8888aa',
        align: 'center',
      })
      .setOrigin(0.5);

    this.scrollRoot = this.scene.add.container(0, this.areaTop);
    this.maskShape = this.scene.add
      .rectangle(
        GAME_WIDTH / 2,
        this.areaTop + (area.bottom - area.top) / 2,
        GAME_WIDTH,
        area.bottom - area.top,
        0xffffff,
        0,
      )
      .setVisible(false);
    this.scrollRoot.setMask(this.maskShape.createGeometryMask());

    this.handRoot = this.scene.add.container(0, 0);
    this.scrollRoot.add(this.handRoot);

    for (let slot = 0; slot < order.length; slot++) {
      this.slotViews.push(this.createSlot(slot));
    }

    this.createScrollbar();
    this.applySpreadLayout(false);
    this.snapFocusToCenter(false);
  }

  private createSlot(slot: number): StripSlotView {
    const deckIdx = this.order[slot]!;
    const card = this.cards[deckIdx]!;
    const peekData = inkCardFaceFromCard(card, { order: slot + 1, slotLabel: card.conceptPrimary, withTags: false });
    const fullData = inkCardFaceFromCard(card, { order: slot + 1, slotLabel: card.conceptPrimary, withTags: true });
    const { fullW, fullH, peekW, peekH, baseY } = this.metrics;

    const container = this.scene.add.container(0, baseY);
    const shadow = this.scene.add.ellipse(0, fullH / 2 + 6, fullW * 0.7, 12, 0x000000, 0.28);
    const glow = this.scene.add
      .rectangle(0, 0, fullW + 20, fullH + 20, FOCUS_GLOW, 0)
      .setVisible(false);
    const selectRing = this.scene.add
      .rectangle(0, 0, peekW + 6, peekH + 6, 0x000000, 0)
      .setStrokeStyle(3, FOCUS_GLOW, 0);
    const peekFace = buildFormationPeekFace(this.scene, peekData, peekW, peekH);
    const fullFace = buildInkCardFace(this.scene, fullData, fullW, fullH);
    fullFace.setVisible(false);
    const hitZone = this.scene.add
      .rectangle(0, 0, peekW, peekH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    container.add([shadow, glow, selectRing, peekFace, fullFace, hitZone]);
    this.handRoot.add(container);

    hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.cardDrag = {
        slot,
        offsetX: container.x - (p.x + this.scrollOffset),
        offsetY: container.y - (p.y - this.areaTop),
        startX: p.x,
        startY: p.y,
        dragged: false,
      };
      container.setDepth(400);
    });

    return {
      slot,
      container,
      peekFace,
      fullFace,
      shadow,
      glow,
      selectRing,
      hitZone,
      spreadX: 0,
    };
  }

  private applySpreadLayout(animate: boolean): void {
    const positions = computeSpreadStripPositions(this.order.length, this.focusSlot, this.metrics);
    this.maxScroll = Math.max(
      0,
      spreadStripContentWidth(this.order.length, this.focusSlot, this.metrics) - GAME_WIDTH,
    );

    for (let i = 0; i < this.slotViews.length; i++) {
      const view = this.slotViews[i]!;
      const pos = positions[i]!;
      const focused = pos.focused;
      view.spreadX = pos.x;

      const peekY = this.metrics.baseY - this.metrics.fullH / 2 + this.metrics.peekH / 2;
      const targetY = focused ? this.metrics.baseY + LIFT_Y : peekY;
      const ringW = focused ? this.metrics.fullW + 8 : this.metrics.peekW + 6;
      const ringH = focused ? this.metrics.fullH + 8 : this.metrics.peekH + 6;

      view.peekFace.setVisible(!focused);
      view.fullFace.setVisible(focused);
      view.fullFace.setScale(1);
      view.glow.setVisible(focused);
      view.glow.setAlpha(focused ? 0.26 : 0);
      view.glow.setSize(this.metrics.fullW + 20, this.metrics.fullH + 20);
      view.selectRing.setSize(ringW, ringH);
      view.selectRing.setStrokeStyle(3, FOCUS_GLOW, focused ? 1 : 0);
      view.hitZone.setSize(focused ? this.metrics.fullW : this.metrics.peekW, focused ? this.metrics.fullH : this.metrics.peekH);
      view.shadow.setAlpha(focused ? 0.38 : 0.18);
      view.container.setDepth(focused ? 200 + i : i);

      if (animate && !(this.cardDrag?.slot === view.slot && this.cardDrag.dragged)) {
        this.scene.tweens.killTweensOf(view.container);
        this.scene.tweens.add({
          targets: view.container,
          x: pos.x,
          y: targetY,
          duration: 240,
          ease: 'Cubic.easeOut',
        });
      } else if (!(this.cardDrag?.slot === view.slot && this.cardDrag.dragged)) {
        view.container.setX(pos.x);
        view.container.setY(targetY);
      }
    }

    this.updateScrollbar();
  }

  private nearestSlotToCenter(): number {
    const centerX = this.scrollOffset + GAME_WIDTH / 2;
    let best = 0;
    let bestDist = Infinity;
    for (const view of this.slotViews) {
      const d = Math.abs(view.spreadX - centerX);
      if (d < bestDist) {
        bestDist = d;
        best = view.slot;
      }
    }
    return best;
  }

  private snapFocusToCenter(animate: boolean): void {
    const focusX = this.slotViews[this.focusSlot]?.spreadX ?? GAME_WIDTH / 2;
    const target = Phaser.Math.Clamp(focusX - GAME_WIDTH / 2, 0, this.maxScroll);
    if (!animate) {
      this.setScroll(target);
      return;
    }
    this.killScrollTween();
    this.scrollAnim.offset = this.scrollOffset;
    this.scrollTween = this.scene.tweens.add({
      targets: this.scrollAnim,
      offset: target,
      duration: 260,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.setScroll(this.scrollAnim.offset),
      onComplete: () => {
        this.scrollTween = null;
      },
    });
  }

  private setFocus(slot: number, animate: boolean): void {
    if (slot < 0 || slot >= this.order.length || slot === this.focusSlot) {
      if (slot === this.focusSlot) this.snapFocusToCenter(animate);
      return;
    }
    this.focusSlot = slot;
    this.applySpreadLayout(animate);
    this.snapFocusToCenter(animate);
  }

  private updateFocusFromScroll(animate: boolean): void {
    const nearest = this.nearestSlotToCenter();
    if (nearest === this.focusSlot) return;

    const oldFocusX = this.slotViews[this.focusSlot]?.spreadX ?? 0;
    this.focusSlot = nearest;
    this.applySpreadLayout(animate);
    const newFocusX = this.slotViews[this.focusSlot]?.spreadX ?? 0;
    this.setScroll(this.scrollOffset + oldFocusX - newFocusX);
  }

  private createScrollbar(): void {
    this.scrollTrack = this.scene.add
      .rectangle(this.trackLeft + this.trackW / 2, this.trackY, this.trackW, this.thumbH, 0x2a2a40, 0.95);

    this.scrollThumb = this.scene.add
      .rectangle(this.trackLeft + this.thumbMinW / 2, this.trackY, this.thumbMinW, this.thumbH, 0x7c5cff, 0.9)
      .setInteractive({ useHandCursor: true });

    this.scrollThumb.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.killScrollTween();
      this.thumbDragStart = { x: p.x, offset: this.scrollOffset };
    });

    this.scrollZone = this.scene.add
      .rectangle(GAME_WIDTH / 2, this.trackY, this.trackW, SCROLLBAR_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.scrollZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.cardDrag) return;
      this.killScrollTween();
      this.scrollDragStart = { x: p.x, offset: this.scrollOffset };
    });

    this.updateScrollbar();
  }

  private killScrollTween(): void {
    this.scrollTween?.stop();
    this.scrollTween = null;
  }

  private onWheel(deltaY: number): void {
    if (this.maxScroll <= 0 && this.order.length <= 1) return;
    this.killScrollTween();
    this.setScroll(this.scrollOffset + deltaY * 0.6);
    this.updateFocusFromScroll(true);
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (this.cardDrag) {
      const dx = p.x - this.cardDrag.startX;
      const dy = p.y - this.cardDrag.startY;
      if (dx * dx + dy * dy > 64) this.cardDrag.dragged = true;

      const view = this.slotViews[this.cardDrag.slot];
      if (!view) return;

      if (this.cardDrag.dragged) {
        view.peekFace.setVisible(false);
        view.fullFace.setVisible(true);
        view.fullFace.setScale(1);
        view.container.setPosition(
          p.x + this.scrollOffset + this.cardDrag.offsetX,
          p.y - this.areaTop + this.cardDrag.offsetY,
        );
        view.container.setDepth(400);
        this.highlightDropTarget(p.x);
      }
      return;
    }

    if (this.thumbDragStart) {
      const trackRange = this.trackW - this.scrollThumb.width;
      const dx = p.x - this.thumbDragStart.x;
      const ratio = trackRange > 0 ? dx / trackRange : 0;
      this.setScroll(this.thumbDragStart.offset + ratio * this.maxScroll);
      this.updateFocusFromScroll(false);
      return;
    }

    if (this.scrollDragStart) {
      const dx = p.x - this.scrollDragStart.x;
      this.setScroll(this.scrollDragStart.offset - dx);
      this.updateFocusFromScroll(false);
    }
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (this.cardDrag) {
      const from = this.cardDrag.slot;
      const wasDrag = this.cardDrag.dragged;
      const contentX = p.x + this.scrollOffset;
      const to = wasDrag ? this.slotFromWorld(contentX) : from;
      this.cardDrag = null;

      if (!wasDrag) {
        if (from === this.focusSlot && this.onCardDetail) {
          const card = this.cards[this.order[from]!];
          if (card) this.onCardDetail(card);
        } else {
          this.setFocus(from, true);
        }
        return;
      }

      if (to !== null && to !== from) {
        this.moveSlot(from, to);
      } else {
        this.rebuildStrip();
        this.setFocus(from, true);
      }
      return;
    }

    const wasScrolling = this.scrollDragStart !== null || this.thumbDragStart !== null;
    this.scrollDragStart = null;
    this.thumbDragStart = null;
    if (wasScrolling) {
      this.updateFocusFromScroll(false);
      this.snapFocusToCenter(true);
    }
  }

  private slotFromWorld(contentX: number): number | null {
    let best: { slot: number; dist: number } | null = null;
    for (const view of this.slotViews) {
      const dx = Math.abs(view.spreadX - contentX);
      if (!best || dx < best.dist) best = { slot: view.slot, dist: dx };
    }
    return best?.slot ?? null;
  }

  private highlightDropTarget(screenX: number): void {
    const target = this.slotFromWorld(screenX + this.scrollOffset);
    for (const view of this.slotViews) {
      const active = target === view.slot && this.cardDrag && target !== this.cardDrag.slot;
      view.selectRing.setStrokeStyle(3, active ? 0x7cff7c : FOCUS_GLOW, active ? 1 : 0);
    }
  }

  private moveSlot(from: number, to: number): void {
    const next = [...this.order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    this.order = next;
    this.focusSlot = to;
    this.onOrderChange(next);
    this.rebuildStrip();
    this.setFocus(to, true);
  }

  private setScroll(offset: number): void {
    this.scrollOffset = Phaser.Math.Clamp(offset, 0, this.maxScroll);
    this.scrollAnim.offset = this.scrollOffset;
    this.scrollRoot.setX(-this.scrollOffset);
    this.updateScrollbar();
  }

  private updateScrollbar(): void {
    if (!this.scrollTrack || !this.scrollThumb) return;

    if (this.maxScroll <= 0) {
      this.scrollTrack.setVisible(false);
      this.scrollThumb.setVisible(false);
      this.scrollZone?.setVisible(false);
      return;
    }

    this.scrollTrack.setVisible(true);
    this.scrollThumb.setVisible(true);
    this.scrollZone?.setVisible(true);

    const contentW = spreadStripContentWidth(this.order.length, this.focusSlot, this.metrics);
    const thumbW = Math.max(this.thumbMinW, (GAME_WIDTH / contentW) * this.trackW);
    const trackRange = this.trackW - thumbW;
    const ratio = this.maxScroll > 0 ? this.scrollOffset / this.maxScroll : 0;

    this.scrollThumb.setSize(thumbW, this.thumbH);
    this.scrollThumb.setX(this.trackLeft + thumbW / 2 + ratio * trackRange);
  }

  enableBackgroundScroll(zone: Phaser.GameObjects.Rectangle): void {
    zone.setInteractive();
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.cardDrag) return;
      this.killScrollTween();
      this.scrollDragStart = { x: p.x, offset: this.scrollOffset };
    });
  }

  private rebuildStrip(): void {
    const slot = this.focusSlot;
    this.scene.tweens.killTweensOf(this.slotViews.map((v) => v.container));
    for (const v of this.slotViews) v.container.destroy();
    this.slotViews = [];

    for (let i = 0; i < this.order.length; i++) {
      this.slotViews.push(this.createSlot(i));
    }

    this.focusSlot = slot;
    this.applySpreadLayout(false);
    this.snapFocusToCenter(false);
  }

  private clear(): void {
    this.killScrollTween();
    this.scene.tweens.killTweensOf(this.slotViews.map((v) => v.container));
    for (const v of this.slotViews) v.container.destroy();
    this.slotViews = [];
    this.handRoot?.destroy();
    this.scrollRoot?.destroy();
    this.maskShape?.destroy();
    this.hintText?.destroy();
    this.scrollTrack?.destroy();
    this.scrollThumb?.destroy();
    this.scrollZone?.destroy();
    this.cardDrag = null;
    this.scrollDragStart = null;
    this.thumbDragStart = null;
  }

  destroy(): void {
    this.scene.input.off('pointermove', this.pointerMoveHandler);
    this.scene.input.off('pointerup', this.pointerUpHandler);
    this.scene.input.off('wheel', this.wheelHandler);
    this.clear();
  }
}

export const FORMATION_LAYOUT = {
  top: 118,
  bottom: 620,
} as const;
