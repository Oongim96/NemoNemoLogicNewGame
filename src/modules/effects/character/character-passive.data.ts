/** 캐릭터 패시브·ult 정의 — content-source/characters 와 동기 */
export interface CharacterPassiveDef {
  characterId: string;
  puzzlePassiveKey?: string;
  puzzlePassiveParam?: string;
  battlePassiveKey?: string;
  battlePassiveParam?: string;
  ultKey?: string;
  ultParam?: string;
  ultUsesPerSection?: number;
}

export const CHARACTER_PASSIVES: CharacterPassiveDef[] = [
  {
    characterId: 'char_luna',
    puzzlePassiveKey: 'line_hint_analyze',
    puzzlePassiveParam: 'uses=2',
    battlePassiveKey: 'tag_retrigger',
    battlePassiveParam: 'tag=달빛;chance=0.3',
    ultKey: 'reveal_area',
    ultParam: 'size=3',
    ultUsesPerSection: 1,
  },
  {
    characterId: 'char_brix',
    puzzlePassiveKey: 'mistake_damage_half',
    battlePassiveKey: 'shield_bonus',
    battlePassiveParam: 'pct=20',
    ultKey: 'fix_wrong_cell',
    ultUsesPerSection: 1,
  },
  {
    characterId: 'char_mio',
    puzzlePassiveKey: 'draft_reroll',
    puzzlePassiveParam: 'uses=1',
    battlePassiveKey: 'luck_crit_gold',
    battlePassiveParam: 'crit=15;gold_pct=10',
    ultKey: 'draft_reroll_all',
    ultUsesPerSection: 1,
  },
  {
    characterId: 'char_sera',
    puzzlePassiveKey: 'high_completion_heal',
    puzzlePassiveParam: 'threshold=0.9;heal=8',
    battlePassiveKey: 'ink_stack_heal',
    battlePassiveParam: 'per_stack=3',
    ultKey: 'reset_mistakes',
    ultUsesPerSection: 1,
  },
  {
    characterId: 'char_vega',
    battlePassiveKey: 'ink_cooldown_reduce',
    battlePassiveParam: 'amount=1',
    ultKey: 'burst_paint',
    ultUsesPerSection: 1,
  },
];

const byId = new Map(CHARACTER_PASSIVES.map((p) => [p.characterId, p]));

export function getCharacterPassiveDef(characterId: string): CharacterPassiveDef | undefined {
  return byId.get(characterId);
}
