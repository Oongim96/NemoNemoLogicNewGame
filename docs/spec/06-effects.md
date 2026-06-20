# 06. 효과 시스템 (카드 · 캐릭터 · 컨셉)

## 구조

```txt
modules/effects/
  domain/           공통 타입·파라미터 파서
  puzzle/           퍼즐 트리거 + puzzleEffectKey 레지스트리
  battle/           턴 합산 전투 + battleEffectKey 레지스트리
  character/        캐릭터 패시브·ult (기획 MD와 동기)
```

카드 JSON의 `battleEffectKey` / `puzzleEffectKey`는 **레지스트리 핸들러**로 해석된다.  
새 컨셉·카드는 키만 추가하면 퍼즐/전투 양쪽에 같은 패턴으로 확장.

## 퍼즐

| 트리거 | 예시 카드 |
| --- | --- |
| `passive` | 잉크 칠하기 (실수 피해 -1) |
| `on_cell_correct` | 연쇄 채색 (십자 힌트) |
| `on_line_complete` | 잉크 방울 (줄 강조) |
| `on_mistake` | 붉은 잉크 (공격 스택) |
| `on_section_complete` | 잉크 해일 (랜덤 3칸) |

`PuzzleScene` → `firePuzzleEffects()` → 힌트 공개·HP·잉크 시드 등 `RunState` 반영.

### 캐릭터 (세라핀 `char_sera`)

| | |
| --- | --- |
| 퍼즐 패시브 | 구역 완성률 90%+ → HP +8 |
| ult | 구역당 1회 실수 HP 환급 |
| 전투 패시브 | 잉크 스택 1당 HP +3 (턴 종료) |

## 자동 전투

큰 그림 100% 후 `AutoBattleScene` — `runAutoBattle()`.

```txt
턴 N: 쿨 0 카드 전부 → battleEffectKey 합산 → 적 피해
     → 세라핀 잉크 회복 패시브
턴 N: 적 1회 반격
```

### 잉크 컨셉 (구현됨)

| battleEffectKey | 동작 |
| --- | --- |
| `deal_damage` | 기본 피해 + param `ink_stack_add` |
| `ink_stack_add` | 잉크 스택 +N |
| `ink_splash_prep` | 스플래시 % 준비 |
| `add_buff_pct` | 공격 % 버프 합산 |
| `ink_stack_consume_mult` | 스택 소모 ×배율 (광역 optional) |
| `ink_explosion_if_turn` | 턴 잉크 3장+ 폭발 보조 |

**컨셉 임계** (`concept-thresholds.json`): 덱 3/6+, 턴 3/5+ 장 — `concept-threshold.service.ts`

퍼즐에서 쌓인 `carryover.inkStackSeed` → 전투 시작 잉크로 이전.

## 시작 덱

출전 캐릭터 `primaryConcept` 기준 스타터 2장 + `start_001`/`start_002`.  
세라핀: `ink_001`, `ink_002`.

## 코드 위치

| | 경로 |
| --- | --- |
| 퍼즐 발동 | `scenes/PuzzleScene.ts` |
| 전투 | `scenes/AutoBattleScene.ts` |
| RunState carryover | `modules/run/domain/run-state.entity.ts` |
| 캐릭터 패시브 데이터 | `modules/effects/character/character-passive.data.ts` |
