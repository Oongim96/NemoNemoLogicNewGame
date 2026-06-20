# 02. 구역 보상

## 맵 표시 3종 (`SectionRewardCategory`)

| category | 맵 아이콘 | 배정 가중치 |
| --- | --- | --- |
| `draft` | 🃏 3택1 | 72 |
| `shop` | 🏪 상점 | 10 |
| `event` | ✨ 이벤트 | 18 |

상수: `modules/reward/domain/reward.constants.ts` → `SECTION_CATEGORY_WEIGHTS`

## 클리어 시 실제 지급 (`SectionRewardType`)

| category | resolve 결과 |
| --- | --- |
| draft | `{ type:'draft', goldAmount: 10~18 }` + 3택1 UI |
| shop | `{ type:'shop' }` + 상점 UI |
| event | `EVENT_BUCKET` 롤 → gold / event / heal / trap |

이벤트 버킷 가중치: gold 6, event 5, heal 4, trap 3

## 규칙

1. **런 시작** `generateRunSectionAssignments()` — 구역마다 category 배정
2. **2×2 이상** (`mapGridSize >= 2` && `sectionCount >= 4`):
   - **shop 최소 1구역** 강제
   - **draft(🃏 3택1) 최소 2구역** 강제 (이벤트 구역에서 치환, 상점 구역은 유지)
3. draft의 `goldAmount`는 배정 시 확정; event는 `resolveSectionReward()` 시 1회 롤·캐시

구현: `getMinDraftSections()`, `ensureMinDraftSections()` — `reward-roll.service.ts`

## UI

- `RewardOverlay` — `src/ui/RewardOverlay.ts`
- 닫기 버튼 라벨: `맵으로`

## 기획 문서 대응

- `docs/game-design/05-sections-and-rewards.md`
- `docs/game-design/06-ink-deck-build.md` §구역 완료 보상
