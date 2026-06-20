import type { BattlePlaybackEvent } from '@modules/effects/battle/battle-playback.types';

export interface BattleTurnLine {
  turn: number;
  cards: string[];
  damage: number;
  enemyHpAfter: number;
  partyHpAfter: number;
}

export function summarizeBattleTurns(events: BattlePlaybackEvent[]): BattleTurnLine[] {
  const lines: BattleTurnLine[] = [];
  let current: BattleTurnLine | null = null;

  for (const ev of events) {
    if (ev.kind === 'turn_start' && ev.turn > 0) {
      if (current) lines.push(current);
      current = {
        turn: ev.turn,
        cards: [],
        damage: 0,
        enemyHpAfter: ev.enemyHp ?? 0,
        partyHpAfter: ev.partyHp ?? 0,
      };
    }
    if (!current || ev.turn !== current.turn) continue;
    if (ev.kind === 'card') current.cards.push(ev.cardName ?? ev.text);
    if (ev.kind === 'damage') {
      current.damage += ev.value ?? 0;
      if (ev.enemyHp !== undefined) current.enemyHpAfter = ev.enemyHp;
    }
    if (ev.kind === 'enemy_hit' && ev.partyHp !== undefined) {
      current.partyHpAfter = ev.partyHp;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function formatTurnLine(line: BattleTurnLine): string {
  const cards = line.cards.length > 0 ? line.cards.join(', ') : '—';
  return `T${line.turn}  ${cards}  →  ${line.damage} 피해  (적 ${line.enemyHpAfter} · HP ${line.partyHpAfter})`;
}
