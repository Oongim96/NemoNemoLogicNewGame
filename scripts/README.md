# scripts — 빌드·데이터 변환 스크립트

`src/` 밖에서 돌리는 **Node.js 유틸**. 게임 런타임에 포함되지 않습니다.

| 파일 | 명령 | 하는 일 |
| --- | --- | --- |
| [sync-data.mjs](./sync-data.mjs) | `npm run sync-data` | `content-source/cards/*.csv` → card JSON · `content-source/puzzles/*.json` → puzzle JSON |

## sync-data.mjs

1. `ink_cards_master.csv` 파싱 → `ink-cards.json` (카드 52장 등)
2. `concept_thresholds.csv` 파싱 → `concept-thresholds.json`
3. `puzzles/ink-slime-50x50.json` → `ink-slime-50x50.json` (5×5×10×10 → 50×50 masterGrid + 25 sections)
4. CSV 컬럼명을 TS 타입에 맞게 변환 (`card_id` → `cardId`, 숫자·bool 보정)

**언제 실행**

- 카드 CSV 수정 후
- `npm run build` 시 자동 실행

**관련 문서:** [docs/spec/04-data-pipeline.md](../docs/spec/04-data-pipeline.md)

## 새 스크립트 추가 시

1. 이 README 표에 한 줄 추가
2. `package.json` `scripts`에 npm 명령 등록
3. 필요하면 `docs/spec/`에 절차 문서화
