import { paramNumber } from '@modules/effects/domain/effect-params';
import type { PuzzleEffectResult, PuzzleTrigger } from '@modules/effects/domain/effect.types';
import { emptyPuzzleResult } from '@modules/effects/domain/effect.types';
import type { CharacterPassiveDef } from '@modules/effects/character/character-passive.data';
import { getCharacterPassiveDef } from '@modules/effects/character/character-passive.data';
import type { PuzzleSession } from '@modules/effects/puzzle/puzzle-session.entity';

export function getCharacterPassives(characterId: string): CharacterPassiveDef | undefined {
  return getCharacterPassiveDef(characterId);
}

export function applyCharacterPuzzlePassive(
  _def: CharacterPassiveDef,
  _ctx: { trigger: PuzzleTrigger; session?: PuzzleSession; deckInkCount: number },
): PuzzleEffectResult {
  return emptyPuzzleResult();
}

export function applyCharacterSectionPassive(
  def: CharacterPassiveDef,
  session: PuzzleSession,
): PuzzleEffectResult {
  if (def.puzzlePassiveKey !== 'high_completion_heal') return emptyPuzzleResult();

  const params = def.puzzlePassiveParam ?? '';
  const threshold = paramNumber(parseSimpleParams(params), 'threshold', 0.9);
  const heal = paramNumber(parseSimpleParams(params), 'heal', 8);

  if (session.getCompletionRate() < threshold && !session.meetsHighCompletion()) {
    return emptyPuzzleResult();
  }

  return {
    ...emptyPuzzleResult(),
    messages: [`세라핀: 완성률 ${Math.round(session.getCompletionRate() * 100)}% — HP +${heal}`],
    heal,
  };
}

export function applyCharacterUlt(def: CharacterPassiveDef): { used: boolean; message: string } {
  if (def.ultKey === 'reset_mistakes') {
    return { used: true, message: '세라핀 ult: 구역 실수 초기화' };
  }
  return { used: false, message: '' };
}

/** 전투 턴 종료 시 캐릭터 패시브 */
export function applyCharacterBattlePassive(
  def: CharacterPassiveDef,
  inkStack: number,
): { heal: number; messages: string[] } {
  if (def.battlePassiveKey === 'ink_stack_heal') {
    const per = paramNumber(parseSimpleParams(def.battlePassiveParam), 'per_stack', 3);
    const heal = inkStack * per;
    if (heal <= 0) return { heal: 0, messages: [] };
    return { heal, messages: [`세라핀: 잉크 ${inkStack} → HP +${heal}`] };
  }
  return { heal: 0, messages: [] };
}

function parseSimpleParams(raw?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const [k, v] = part.split('=');
    if (k) out[k.trim()] = (v ?? 'true').trim();
  }
  return out;
}

/** 실수 HP 피해 보정 (브릭스 등) */
export function getMistakeHpMultiplier(characterId: string): number {
  const def = getCharacterPassiveDef(characterId);
  if (def?.puzzlePassiveKey === 'mistake_damage_half') return 0.5;
  return 1;
}
