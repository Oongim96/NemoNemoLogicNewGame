import type { Concept, InkCard } from '@modules/card';
import type { PartyConfig } from '@modules/party';
import type { InkDeck } from '@modules/deck';

/** 퍼즐 효과 발동 타이밍 */
export type PuzzleTrigger =
  | 'passive'
  | 'on_cell_correct'
  | 'on_line_complete'
  | 'on_mistake'
  | 'on_section_complete'
  | 'on_run_start';

export interface PuzzleRevealHint {
  x: number;
  y: number;
  shouldFill: boolean;
}

export interface PuzzleEffectResult {
  messages: string[];
  reveals: PuzzleRevealHint[];
  highlightLine?: { axis: 'row' | 'col'; index: number; durationSec: number };
  heal: number;
  gold: number;
  inkStackDelta: number;
  attackStackDelta: number;
}

export function emptyPuzzleResult(): PuzzleEffectResult {
  return {
    messages: [],
    reveals: [],
    heal: 0,
    gold: 0,
    inkStackDelta: 0,
    attackStackDelta: 0,
  };
}

export function mergePuzzleResults(...parts: PuzzleEffectResult[]): PuzzleEffectResult {
  const out = emptyPuzzleResult();
  for (const p of parts) {
    out.messages.push(...p.messages);
    out.reveals.push(...p.reveals);
    out.heal += p.heal;
    out.gold += p.gold;
    out.inkStackDelta += p.inkStackDelta;
    out.attackStackDelta += p.attackStackDelta;
    if (p.highlightLine) out.highlightLine = p.highlightLine;
  }
  return out;
}

/** 런 전체 퍼즐 보정 (패시브·덱 임계) */
export interface PuzzleRunModifiers {
  mistakeHpReduce: number;
  inkMaxStackBonus: number;
}

export interface PuzzleRunCarryover {
  /** 전투 시작 시 잉크 스택 시드 */
  inkStackSeed: number;
  /** 붉은 잉크 등 — 실수 누적 공격 스택 */
  attackStackBonus: number;
  puzzleComboMax: number;
}

export interface BattleLogEntry {
  turn: number;
  phase: 'player' | 'enemy' | 'system';
  text: string;
}

export interface BattleTurnSummary {
  turn: number;
  cardsPlayed: string[];
  damageDealt: number;
  healAmount: number;
  inkStackAfter: number;
  enemyHpAfter: number;
  logs: string[];
}

export interface BattleResult {
  victory: boolean;
  turns: number;
  totalDamage: number;
  log: BattleLogEntry[];
  turnSummaries: BattleTurnSummary[];
}

export interface BattleEffectContext {
  card: InkCard;
  deck: InkDeck;
  party: PartyConfig;
  params: Record<string, string>;
  inkCardsThisTurn: number;
  turn: TurnAccumulator;
}

/** 한 턴 합산 버퍼 */
export interface TurnAccumulator {
  baseDamage: number;
  hitCount: number;
  inkStackGain: number;
  inkStackConsume: number;
  atkBuffPct: number;
  shieldGain: number;
  splashPct: number;
  aoeMult: number;
  forceExplosion: boolean;
  messages: string[];
}

export function createTurnAccumulator(): TurnAccumulator {
  return {
    baseDamage: 0,
    hitCount: 0,
    inkStackGain: 0,
    inkStackConsume: 0,
    atkBuffPct: 0,
    shieldGain: 0,
    splashPct: 0,
    aoeMult: 0,
    forceExplosion: false,
    messages: [],
  };
}

export interface ConceptCountContext {
  deck: InkDeck;
  concept: Concept;
  turnConceptCount: number;
}
