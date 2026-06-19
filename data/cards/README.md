# 잉크 카드 데이터

카드 마스터 · 컨셉 임계치 · 구현 참고.

## 문서

| 문서 | 내용 |
| --- | --- |
| **[ink-cards.md](./ink-cards.md)** | **카드 52장** (컨셉별, 보기 좋게) |
| [character-unique-cards.md](./character-unique-cards.md) | 캐릭터 고유 카드 |
| [concept-thresholds.md](./concept-thresholds.md) | 덱/턴 임계치 |
| [드래프트 확률](../../docs/game-design/06c-draft-probability.md) | **3택1 확률** |
| [ink_cards_master.csv](./ink_cards_master.csv) | **구현용 CSV** (수정 후 `npm run sync-data`) |
| `../../src/data/ink-cards.json` | 게임 런타임 JSON (자동 생성) |
| `../../src/data/concept-thresholds.json` | 임계치 JSON (자동 생성) |

## 빠른 통계

| 컨셉 | 카드 수 |
| --- | --- |
| 잉크 | 8 |
| 불꽃 | 6 |
| 달빛 | 6 |
| 철벽 | 6 |
| 행운 | 7 |
| 힌트 | 6 |
| 격자 | 6 |
| 저주 | 6 |
| 시작 덱 | 2 |
| **합계** | **52** |

## 등급·타입

- **등급:** 일반(common) · 희귀(rare) · 에픽(epic)
- **전투 타입:** 공격 · 버프 · 실드 · 스택 · 특수
- **CD:** 전투 쿨 (턴)

## 관련 기획

- [06. 잉크 덱 빌드](../../docs/game-design/06-ink-deck-build.md)
- [06c. 드래프트 확률](../../docs/game-design/06c-draft-probability.md)
