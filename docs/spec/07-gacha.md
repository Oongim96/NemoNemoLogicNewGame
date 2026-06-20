# 07. 가챠

## 1회 구성

**캐릭터 또는 카드 중 하나만** 나온다 (배타).

| 결과 | 확률 | 내용 |
| --- | --- | --- |
| **카드** | **90%** | 일반 65% / 희귀 28% / 에픽 7% · `start_*` 제외 |
| **캐릭터** | **10%** | SR 88% / SSR 12% · 로스터 전원 (중복 가능) |

신규 캐릭터 → **고유 카드** 자동 지급 (`addCharacter`).

## 중복 환급

| | 환급 |
| --- | --- |
| SR 캐릭 중복 | 💎 60 |
| SSR 캐릭 중복 | 💎 180 |
| 일반 카드 중복 | 🪙 20 |
| 희귀 카드 중복 | 🪙 50 + 💎 5 |
| 에픽 카드 중복 | 🪙 80 + 💎 15 |

## 비용

- 1회 100💎 · 10회 900💎

## UI

- `scenes/GachaScene.ts` — 소환 버튼
- `ui/gacha-reveal-overlay.ts` — 카드 뒤집기 연출 (1회 1장 / 10회 10장)

## 코드

- `modules/gacha/domain/gacha.service.ts`
- `modules/meta/domain/player-profile.entity.ts` — `pullGacha`, `pullTenGacha`
- `scenes/GachaScene.ts`
