# 00. 아키텍처

## 레이어 (클린 아키텍처)

```txt
scenes/        Phaser Scene — 여러 모듈 조합·화면 전환
ui/            공유 Phaser UI (오버레이 등)
domain         순수 TS: 규칙·엔티티·서비스  →  Phaser import 금지
infrastructure JSON 로드, CSV 파이프라인
```

씬은 특정 도메인 모듈에 속하지 않는다. `MapScene`은 run·reward·puzzle을, `PuzzleScene`은 puzzle·reward·run을 함께 쓴다.

## 디렉터리 구조

```txt
src/
  app/             Phaser 부트스트랩·전역 config
  scenes/          Phaser Scene (Boot, MainMenu, Map, Puzzle, RunComplete)
  ui/              공유 UI (RewardOverlay 등)
  modules/
    card/          카드 타입·리포지토리·JSON
    deck/          잉크 덱 엔티티
    party/         파티·고유카드 매핑
    run/           RunState·런 진행
    reward/        보상 롤·상수·이벤트
    draft/         3택1·상점 오퍼 가중치
    puzzle/        네모네모·구역 퍼즐 데이터
```

각 **모듈**은 `index.ts`로 public API만 export. 모듈 안에는 domain + infrastructure만 둔다.

## Import 규칙

- `@app/*` — `src/app/`
- `@scenes/*` — `src/scenes/`
- `@ui/*` — `src/ui/`
- `@modules/<feature>` — 해당 모듈 barrel
- **금지**: domain → Phaser / scenes / ui
- **권장**: scenes·ui → modules domain (barrel 경유)

## Phaser 전역 상태

- `RunState` 인스턴스: `registry.set('runState', …)` (메뉴에서 생성)
- 씬 이름: `BootScene`, `MainMenuScene`, `MapScene`, `PuzzleScene`, `RunCompleteScene`

## 미구현 (스펙만 존재)

- 자동 전투 → `docs/game-design/07-auto-battle.md` (모듈 `battle/` 추후)
- 가챠 메타 → `09-characters-gacha.md`
- 이어하기 저장
