# NemoNemoLogicNewGame

**픽셀 던전: 잉크 오브 운명** — 네모네모 로직 × 로그라이크 × 자동 전투 RPG

## 빠른 시작

```bash
npm install
npm run sync-data   # data/cards/*.csv → src/data/*.json
npm run dev         # http://localhost:5173
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (핫 리로드) |
| `npm run build` | 타입체크 + 프로덕션 빌드 → `dist/` |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run sync-data` | 기획 CSV를 게임 JSON으로 변환 |
| `npm run typecheck` | TypeScript 검사만 |

## 프로젝트 구조

```txt
NemoNemoLogicNewGame/
├── index.html              # Vite 엔트리
├── package.json
├── vite.config.ts
├── tsconfig.json
│
├── src/                    # 게임 구현 (TypeScript + Phaser 3)
│   ├── main.ts             # Phaser 부트스트랩
│   ├── config.ts           # 해상도·색상 상수
│   ├── scenes/             # Boot, MainMenu, Puzzle …
│   ├── systems/            # DataRegistry, InkDeck …
│   ├── types/              # 카드·컨셉 타입
│   └── data/               # 런타임 JSON (sync-data로 생성)
│
├── public/assets/          # 스프라이트·BGM (추가 예정)
├── scripts/sync-data.mjs   # CSV → JSON 변환
│
├── data/                   # 기획용 원본 데이터 (사람이 편집)
│   ├── cards/              # 카드 MD·CSV
│   └── characters/         # 캐릭터 MD
│
└── docs/game-design/       # 게임 디자인 문서 (01~12)
```

### 데이터 흐름

```txt
data/cards/ink_cards_master.csv  ──sync-data──►  src/data/ink-cards.json
data/cards/concept_thresholds.csv ──sync-data──►  src/data/concept-thresholds.json
```

카드 밸런스를 바꿀 때: **CSV 수정 → `npm run sync-data` → 게임 반영**

읽기용 마크다운(`ink-cards.md`, `limited-characters.md` 등)은 `data/`에 그대로 둡니다.

## 기획 문서

| 경로 | 내용 |
| --- | --- |
| **[game-design.md](./game-design.md)** | 기획 목차 (빠른 링크) |
| **[docs/game-design/README.md](./docs/game-design/README.md)** | 파트별 기획 01~12 |
| **[data/cards/ink-cards.md](./data/cards/ink-cards.md)** | 카드 52장 |
| **[data/characters/limited-characters.md](./data/characters/limited-characters.md)** | SSR 8인 |

## 기술 스택

- **TypeScript** + **Phaser 3** + **Vite**
- 추후 배포: Capacitor (iOS/Android), Tauri (PC)

## 현재 구현 상태

- [x] Vite + Phaser + TS 프로젝트 뼈대
- [x] 카드·임계치 데이터 로드 (`DataRegistry`)
- [x] 메인 메뉴 + 5×5 데모 퍼즐 씬
- [ ] 구역 맵 · 큰 그림
- [ ] 칸 보상 · 3택1 드래프트
- [ ] 잉크 덱 · 상점
- [ ] 자동 전투
- [ ] 이어하기 · 가챠 메타
