import type { Concept } from '@modules/card';

export type BattleEventKind =
  | 'system'
  | 'turn_start'
  | 'card'
  | 'threshold'
  | 'damage'
  | 'heal'
  | 'ink'
  | 'enemy_hit'
  | 'victory'
  | 'defeat';

export interface BattlePlaybackEvent {
  id: number;
  phase: 'system' | 'player' | 'enemy';
  turn: number;
  kind: BattleEventKind;
  text: string;
  cardName?: string;
  concept?: Concept;
  value?: number;
  enemyHp?: number;
  partyHp?: number;
  inkStack?: number;
  enemyMaxHp?: number;
}

export interface BattlePlaybackResult {
  events: BattlePlaybackEvent[];
  victory: boolean;
  turns: number;
  totalDamage: number;
}
