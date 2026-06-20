import Phaser from 'phaser';
import { buildBattlePlayback } from '@modules/effects';
import type { BattlePlaybackEvent } from '@modules/effects/battle/battle-playback.types';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import type { PlayerProfile } from '@modules/meta';
import { clearRunSession, settleRunGold, type RunState } from '@modules/run';
import { AutoBattleArena, AutoBattleLog, BATTLE_LAYOUT } from '@ui/auto-battle-view';

export class AutoBattleScene extends Phaser.Scene {
  private playbackEvents: BattlePlaybackEvent[] = [];
  private eventIndex = 0;
  private arena!: AutoBattleArena;
  private log!: AutoBattleLog;
  private playing = true;
  private skipped = false;
  private playbackResult!: ReturnType<typeof buildBattlePlayback>;
  private footerContainer: Phaser.GameObjects.Container | null = null;
  private skipBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('AutoBattleScene');
  }

  shutdown(): void {
    this.log?.destroy();
  }

  create(): void {
    const run = this.registry.get('runState') as RunState;
    const party = run.getParty();
    const charName = party.members[0]?.name ?? '파티';

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 22, '자동 전투', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const arenaCenterY = BATTLE_LAYOUT.arenaTop + BATTLE_LAYOUT.arenaHeight / 2;

    this.playbackResult = buildBattlePlayback({
      deck: run.getDeck(),
      party,
      modifiers: run.getPuzzleModifiers(),
      carryover: run.getCarryover(),
      enemyHp: run.getEnemyHpForBattle(),
      formationOrder: run.getBattleFormation(),
    });

    this.playbackEvents = this.playbackResult.events;
    this.eventIndex = 0;

    const first = this.playbackEvents[0];
    const enemyMax = first?.enemyMaxHp ?? 2800;

    this.arena = new AutoBattleArena(this, arenaCenterY);
    this.arena.setInitialState(enemyMax, enemyMax, 10, first?.inkStack ?? 0);

    this.log = new AutoBattleLog(this);

    this.add
      .text(GAME_WIDTH / 2, BATTLE_LAYOUT.arenaTop - 6, `${charName} · 배치 ${run.getDeck().size}장`, {
        fontSize: '11px',
        color: '#666680',
      })
      .setOrigin(0.5);

    this.add.rectangle(GAME_WIDTH / 2, BATTLE_LAYOUT.logTop - 6, GAME_WIDTH - 24, 2, 0x3a3a55);

    this.skipBtn = this.add
      .text(GAME_WIDTH - 16, 22, 'SKIP', {
        fontSize: '12px',
        color: '#7c5cff',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    this.skipBtn.on('pointerdown', () => this.skipToResult());

    this.playNextEvent();
  }

  private playNextEvent(): void {
    if (!this.playing || this.eventIndex >= this.playbackEvents.length) {
      this.showFooter();
      return;
    }

    const ev = this.playbackEvents[this.eventIndex]!;
    this.eventIndex++;

    this.log.append(ev);

    const pause =
      ev.kind === 'card' ? 100 : ev.kind === 'damage' ? 80 : ev.kind === 'turn_start' ? 60 : 50;

    this.arena.playEvent(ev, () => {
      this.time.delayedCall(pause, () => this.playNextEvent());
    });
  }

  /** 애니 생략 → 계산 결과·로그만 즉시 표시 */
  private skipToResult(): void {
    if (!this.playing || this.footerContainer) return;
    this.skipped = true;
    this.playing = false;
    this.tweens.killAll();
    this.skipBtn.disableInteractive().setAlpha(0.35);

    while (this.eventIndex < this.playbackEvents.length) {
      const ev = this.playbackEvents[this.eventIndex]!;
      this.eventIndex++;
      this.log.append(ev);
      this.applyEventState(ev);
    }

    const last = this.playbackEvents[this.playbackEvents.length - 1];
    if (last?.kind === 'victory' || last?.kind === 'defeat') {
      this.arena.playEvent(last, () => this.showFooter());
    } else {
      this.showFooter();
    }
  }

  private applyEventState(ev: BattlePlaybackEvent): void {
    if (ev.enemyHp !== undefined || ev.partyHp !== undefined || ev.inkStack !== undefined) {
      this.arena.setInitialState(
        ev.enemyHp ?? 0,
        ev.enemyMaxHp ?? 2800,
        ev.partyHp ?? 0,
        ev.inkStack ?? 0,
      );
    }
  }

  private showFooter(): void {
    this.playing = false;
    if (this.footerContainer) return;

    const run = this.registry.get('runState') as RunState;
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    const settledGold = settleRunGold(profile, run);

    const { victory, turns, totalDamage } = this.playbackResult;
    const outcomeColor = victory ? '#7cff7c' : '#ff7c7c';

    this.footerContainer = this.add.container(0, 0);

    const resultText = this.add
      .text(GAME_WIDTH / 2, BATTLE_LAYOUT.footerY - 52, victory ? '승리!' : '패배…', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: outcomeColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const stats = this.add
      .text(
        GAME_WIDTH / 2,
        BATTLE_LAYOUT.footerY - 26,
        `${turns}턴 · 총 ${totalDamage} 피해${this.skipped ? ' · 스킵' : ''}`,
        {
          fontSize: '11px',
          color: '#8888aa',
        },
      )
      .setOrigin(0.5);

    const goldLine =
      settledGold > 0
        ? `🪙 +${settledGold} · 보유 ${profile.getGold()}`
        : '🪙 런 골드 없음';

    const goldText = this.add
      .text(GAME_WIDTH / 2, BATTLE_LAYOUT.footerY - 6, goldLine, {
        fontSize: '11px',
        color: '#ffd700',
      })
      .setOrigin(0.5);

    const hubBtn = this.add
      .rectangle(GAME_WIDTH / 2, BATTLE_LAYOUT.footerY + 36, GAME_WIDTH - 48, 44, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    const hubLabel = this.add
      .text(GAME_WIDTH / 2, BATTLE_LAYOUT.footerY + 36, '허브로', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    hubBtn.on('pointerover', () => hubBtn.setFillStyle(0x9b8aff));
    hubBtn.on('pointerout', () => hubBtn.setFillStyle(COLORS.accent));
    hubBtn.on('pointerdown', () => {
      clearRunSession(this.registry);
      this.scene.start('HubScene');
    });

    this.footerContainer.add([resultText, stats, goldText, hubBtn, hubLabel]);
    this.skipBtn.setVisible(false);
  }
}
