# 01. 런 플로우

## 앱 진입 (메타)

```txt
BootScene → SplashScene → LoadingScene → LoginScene → HubScene
```

| 화면 | 경로 |
| --- | --- |
| 스플래시 | `scenes/SplashScene.ts` |
| 로딩 | `scenes/LoadingScene.ts` |
| 로그인 | `scenes/LoginScene.ts` |
| 허브 (로비 · 하단 네비) | `scenes/HubScene.ts` |
| 그림 선택 (전투 시작) | `scenes/StageSelectScene.ts` |
| 캐릭터 도감 | `scenes/CharacterScene.ts` |
| 카드 도감 | `scenes/CardCollectionScene.ts` |
| 가챠 / 설정 | `GachaScene`, `SettingsScene` |

전역 메타: `registry.set('playerProfile', PlayerProfile)` — `modules/meta/`

## 한 런의 상태 머신

```txt
HubScene
  → [전투 시작] StageSelectScene (그림 목록 — 난이도는 스테이지별 고정)
  → [그림 선택] RunState.createFresh({ mapSize }) → MapScene
       → 클릭: PuzzleScene(sectionIndex)
       → 클리어: 보상 오버레이 → MapScene
       → N/N 완료: RunCompleteScene → AutoBattleScene → HubScene
```

## 핵심 엔티티: `RunState`

| 필드/행동 | 설명 |
| --- | --- |
| `progress` | completedSections, gold, mistakes |
| `deck` | InkDeck |
| `party` | 출전 캐릭터 1인 (`PlayerProfile.getPartyConfig()`) |
| `sectionAssignments` | 런 시작 시 보상 카테고리 배정 |
| `completeSection(i)` | 클리어 + 골드 +10 |
| `resolveSectionReward(i)` | 실제 보상 (이벤트 구역은 여기서 세부 롤) |
| `getSectionCategory(i)` | 맵 표시용 3종 |

## 맵

- 그림(스테이지)별 `mapSize` 고정: 슬라임 숲 **1×1** → 고대 용 **2×2** → 용의 전설 **3×3** (`modules/meta/domain/picture-stages.data.ts`)
- **예시** `demo_ink_slime`: **2×2 구역**, 구역당 **5×5** 퍼즐 → 완성 **10×10** (`puzzle-sets/slime-10x10.data.ts`)
- `registry.currentPicture.puzzleSetId` — 퍼즐 데이터 선택
- 구역당 퍼즐 3×3 (데모), `section-puzzles.data.ts`
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
