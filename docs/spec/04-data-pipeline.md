# 04. 데이터 파이프라인

## 원본 (사람이 편집) — `content-source/`

```txt
content-source/cards/ink_cards_master.csv      → 카드 마스터
content-source/cards/concept_thresholds.csv    → 컨셉 임계치
content-source/cards/ink-cards.md              → 읽기용 (구현 X)
content-source/characters/*.md                 → 캐릭터 기획
```

## 런타임 JSON

```bash
npm run sync-data
```

```txt
content-source/cards/*.csv  →  src/modules/card/infrastructure/data/*.json
```

## 로드

- `cardRepository` — `ink-cards.json`, `concept-thresholds.json` import
- 타입: `modules/card/domain/card.types.ts`

## 시작 덱

- `start_001`, `start_002` — RunState 생성 시 자동 추가

## 밸런스 수정 절차

1. CSV 수정 (`content-source/cards/`)
2. `npm run sync-data`
3. 수치가 플레이에 영향 있으면 `docs/spec/03-draft.md` 등 스펙 확인·갱신
4. UX 설명이 바뀌면 `docs/game-design/` 해당 문서 갱신
