export { emptyPuzzleResult, mergePuzzleResults } from '@modules/effects/domain/effect.types';
export type {
  BattleLogEntry,
  BattleResult,
  BattleTurnSummary,
  PuzzleEffectResult,
  PuzzleRevealHint,
  PuzzleRunCarryover,
  PuzzleRunModifiers,
  PuzzleTrigger,
} from '@modules/effects/domain/effect.types';
export { parseEffectParams, paramNumber, paramBool } from '@modules/effects/domain/effect-params';

export { PuzzleSession, pickRandomUnresolvedCells } from '@modules/effects/puzzle/puzzle-session.entity';
export { isRowResolved, isColResolved, countSolutionFillCells } from '@modules/effects/puzzle/puzzle-line.logic';
export {
  collectPassiveModifiers,
  firePuzzleEffects,
  getConceptStarterCards,
  tryCharacterUlt,
} from '@modules/effects/puzzle/puzzle-effect.service';

export { getCharacterPassiveDef, CHARACTER_PASSIVES } from '@modules/effects/character/character-passive.data';
export {
  getCharacterPassives,
  getMistakeHpMultiplier,
  applyCharacterBattlePassive,
} from '@modules/effects/character/character-passive.service';

export { BattleState, createBattleInstances } from '@modules/effects/battle/battle-state.entity';
export { runAutoBattle, prepareBattleState, type AutoBattleInput } from '@modules/effects/battle/auto-battle.service';
export { buildBattlePlayback } from '@modules/effects/battle/battle-playback.service';
export type { BattlePlaybackEvent, BattlePlaybackResult, BattleEventKind } from '@modules/effects/battle/battle-playback.types';
export {
  getDeckThresholds,
  getTurnThresholds,
  applyDeckThresholdModifiers,
} from '@modules/effects/battle/concept-threshold.service';
