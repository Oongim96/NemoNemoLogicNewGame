# NemoNemoLogicNewGame

**픽셀 던전: 잉크 오브 운명** — 네모네모 로직 × 로그라이크 × 자동 전투 RPG

## 빠른 시작

```bash
npm install
npm run sync-data   # data/cards/*.csv → src/modules/card/infrastructure/data/
npm run dev
```

## 문서

| 경로 | 용도 |
| --- | --- |
| **[docs/spec/README.md](./docs/spec/README.md)** | **구현 스펙** (코드·수치·플로우) |
| [docs/game-design/README.md](./docs/game-design/README.md) | 플레이 기획 (01~12) |
| [data/](./data/) | 카드·캐릭터 원본 데이터 |
| [.cursor/rules/](./.cursor/rules/) | Cursor AI 규칙 |

## 프로젝트 구조 (클린 아키텍처 · 모듈별)

```txt
src/
  app/                    # Phaser 부트, game.config
  scenes/                 # Phaser Scene (Boot, Map, Puzzle, …)
  ui/                     # 공유 UI (RewardOverlay 등)
  modules/
    card/                 # domain + infrastructure (JSON)
    deck/                 # 잉크 덱 엔티티
    party/                # 파티·고유카드
    run/                  # RunState
    reward/               # 보상 롤·상수
    draft/                # 3택1·상점 가중치
    puzzle/               # 네모네모 로직·퍼즐 데이터
data/                     # 기획 원본 (CSV, MD)
docs/
  spec/                   # 구현 스펙 ← 코드 변경 시 동기화
  game-design/            # 플레이 기획
scripts/sync-data.mjs
```

### 레이어

- **domain** — 순수 TS (Phaser 없음), `modules/*/domain`
- **infrastructure** — JSON·리포지토리
- **scenes / ui** — Phaser Scene·오버레이 (`src/scenes`, `src/ui`)

Import: `@app/*`, `@scenes/*`, `@ui/*`, `@modules/<feature>`

## 구현 상태

- [x] 모듈형 클린 아키텍처
- [x] 3×3 맵 런 · 구역 퍼즐 · 보상 (3종 맵 표시)
- [x] 드래프트 · 상점 · 이벤트 버킷
- [ ] 자동 전투
- [ ] 이어하기 · 가챠 메타
