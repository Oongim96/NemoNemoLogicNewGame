# NemoNemoLogicNewGame

**픽셀 던전: 잉크 오브 운명** — 네모네모 로직 × 로그라이크 × 자동 전투 RPG

## 빠른 시작

```bash
npm install
npm run sync-data   # content-source/cards/*.csv · puzzles/*.json → JSON
npm run dev
```

## 폴더 안내 (`src/` 제외)

각 폴더 **README**가 역할·파일 목록·갱신 절차를 설명합니다. 구조를 바꿀 때 README도 함께 수정합니다.

| 폴더 | README | 한 줄 요약 |
| --- | --- | --- |
| **[docs/](./docs/)** | [docs/README.md](./docs/README.md) | 기획서 + 구현 스펙 |
| ↳ spec | [docs/spec/README.md](./docs/spec/README.md) | 코드·수치·플로우 (구현 기준) |
| ↳ game-design | [docs/game-design/README.md](./docs/game-design/README.md) | 플레이 기획 01~12 |
| **[content-source/](./content-source/)** | [content-source/README.md](./content-source/README.md) | CSV·MD **편집용 원본** |
| ↳ cards | [content-source/cards/README.md](./content-source/cards/README.md) | 카드 52장·임계치 |
| ↳ characters | [content-source/characters/README.md](./content-source/characters/README.md) | SR·SSR 캐릭터 |
| ↳ puzzles | [content-source/puzzles/README.md](./content-source/puzzles/README.md) | 50×50 잉크 슬라임 예시 (5×5×10×10) |
| **[public/](./public/)** | [public/README.md](./public/README.md) | Vite 정적 파일 |
| ↳ assets | [public/assets/README.md](./public/assets/README.md) | 이미지·에셋 팩 |
| **[scripts/](./scripts/)** | [scripts/README.md](./scripts/README.md) | `sync-data` 등 빌드 스크립트 |
| **[.cursor/](./.cursor/)** | [.cursor/README.md](./.cursor/README.md) | Cursor AI 규칙 |

게임 코드: **`src/`** — [docs/spec/00-architecture.md](./docs/spec/00-architecture.md)

## 프로젝트 구조 요약

```txt
src/                 # TypeScript · Phaser (app, scenes, ui, modules)
content-source/      # 편집용 원본 → sync-data → src/.../data/
public/assets/       # 번들·CDN 에셋 파일
docs/                # spec + game-design
scripts/             # Node 빌드 스크립트
```

Import: `@app/*`, `@scenes/*`, `@ui/*`, `@modules/<feature>`

## 구현 상태

- [x] 모듈형 클린 아키텍처 · 모바일 세로 UI
- [x] 앱 플로우 (스플래시 · 로그인 · 하단 네비)
- [x] 캐릭터/카드 도감 분리 · 1×1~3×3 맵 런
- [x] 드래프트 · 상점 · 이벤트 · 에셋 팩 골격
- [ ] 자동 전투 · 이어하기 · 원격 에셋 캐시

## 진입 문서

- 기획 한눈에: [game-design.md](./game-design.md)
- 구현 전 필독: [docs/spec/README.md](./docs/spec/README.md)
