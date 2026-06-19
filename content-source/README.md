# content-source — 기획·밸런스 **편집용 원본**

게임이 **직접 읽지 않습니다.** CSV·MD를 수정한 뒤 파이프라인으로 `src/`에 반영합니다.

| 하위 | README | 런타임 반영 |
| --- | --- | --- |
| [cards/](./cards/) | [cards/README.md](./cards/README.md) | `npm run sync-data` → `src/modules/card/infrastructure/data/*.json` |
| [characters/](./characters/) | [characters/README.md](./characters/README.md) | (추후 sync) · 현재 `modules/meta` 코드 |

## 다른 폴더와 구분

| 폴더 | 역할 |
| --- | --- |
| `docs/game-design/` | 플레이 의도·플로우 (**읽기용** 기획서) |
| **`content-source/`** | **수치·마스터 테이블** (엑셀/CSV 작업) |
| `src/modules/*/infrastructure/data/` | **빌드된 게임 JSON** (자동 생성) |

## 카드 수정 절차

1. `cards/ink_cards_master.csv` 또는 `concept_thresholds.csv` 편집
2. `npm run sync-data`
3. 스펙·기획서 필요 시 [docs/spec/](../docs/spec/) · [docs/game-design/](../docs/game-design/) 갱신

**파이프라인:** [docs/spec/04-data-pipeline.md](../docs/spec/04-data-pipeline.md) · [scripts/README.md](../scripts/README.md)
