# 01. 런 플로우

## 한 런의 상태 머신

```txt
MainMenuScene
  → [런 시작] RunState.createFresh()
  → MapScene
       → 클릭: PuzzleScene(sectionIndex)
       → 클리어: 보상 오버레이 → MapScene
       → 9/9 완료: RunCompleteScene
```

## 핵심 엔티티: `RunState`

| 필드/행동 | 설명 |
| --- | --- |
| `progress` | completedSections, gold, mistakes |
| `deck` | InkDeck |
| `party` | DEFAULT_PARTY (SR 4인) |
| `sectionAssignments` | 런 시작 시 보상 카테고리 배정 |
| `completeSection(i)` | 클리어 + 골드 +10 |
| `resolveSectionReward(i)` | 실제 보상 (이벤트 구역은 여기서 세부 롤) |
| `getSectionCategory(i)` | 맵 표시용 3종 |

## 맵

- 현재: `MAP_SIZE = 3` (9구역), `section-puzzles.data.ts`
- 구역당 퍼즐 3×3 (데모)
- 완료 구역: 퍼즐 solution 픽셀을 큰 그림 조각으로 표시

## 퍼즐

- 좌클릭: fill / 우클릭: mark
- 오답: mistakes++, HP--
- 전체 solution 일치 → 구역 완료 → 보상

## 코드 위치

| | 경로 |
| --- | --- |
| RunState | `modules/run/domain/run-state.entity.ts` |
| MapScene | `scenes/MapScene.ts` |
| PuzzleScene | `scenes/PuzzleScene.ts` |
| 메뉴 | `scenes/BootScene.ts`, `MainMenuScene.ts`, `RunCompleteScene.ts` |
