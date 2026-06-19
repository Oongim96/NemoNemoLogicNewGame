# 03. 드래프트 (3택1)

## 진입

- 구역 category가 `draft`이고 클리어 시 `openDraft()` 호출

## 풀 필터

1. `enabled`, `draftWeight > 0`
2. 덱 `maxPerDeck` 미만
3. 구역 클리어 수 < 7 → epic 제외
4. 타 파티 고유 카드 제외

## 가중치 (`computeCardWeight`)

```
weight = draft_weight × partyConceptMult × uniqueEarlyMult × varietyMult
```

| 요소 | 배율 |
| --- | --- |
| 주 컨셉 2명+ | ×2.2 |
| 주 컨셉 1명 | ×1.8 |
| 부 컨셉만 | ×1.3 |
| 무관 | ×0.85 |
| 고유 미보유 (구역 0~1) | ×8 |
| 고유 미보유 (2~4) | ×4 |
| 고유 보유 | ×0.4 |

## 슬롯 규칙

- 3장 중복 card_id 없음
- 구역 0~2: 희귀 이상 최대 1장
- 첫 드래프트: 파티 고유 미보유 1장 강제 슬롯
- 3장 모두 off-theme → 파티 컨셉 1장으로 교체

## 상점 오퍼

- `pickShopOffers()` — 동일 가중 풀에서 3장
- 가격: common 12, rare 22, epic 40

## 코드

- `modules/draft/domain/draft.service.ts`
- `modules/party/` — DEFAULT_PARTY, 고유 카드 ID
- `modules/card/infrastructure/card.repository.ts`
- Run 의존: `RunDraftContext` (completedCount, draft 플래그)

## 기획 대응

- `docs/game-design/06c-draft-probability.md`
