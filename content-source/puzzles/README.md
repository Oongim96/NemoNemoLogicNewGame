# 퍼즐 · 큰 그림 데이터

## 크기 공식

**완성 그림 한 변 = `mapSize × puzzleSize`**

- 5×5 맵 + 구역당 10×10 → **50×50**
- 2×2 맵 + 구역당 3×3 → **6×6** (9×9 아님)

## 문서

| 문서 | 내용 |
| --- | --- |
| **[ink-slime-50x50.md](./ink-slime-50x50.md)** | **50×50 잉크 슬라임 예시** (5×5 맵 · 10×10×25) |
| [ink-slime-50x50.json](./ink-slime-50x50.json) | 편집용 JSON |
| `../../src/modules/puzzle/infrastructure/data/ink-slime-50x50.json` | sync 후 런타임 JSON |

## 수정 절차

1. `ink-slime-50x50.json` 편집 (`mapSize`, `puzzleSize`, 또는 `masterGrid` 직접 지정)
2. `npm run sync-data`
3. `.md` 갱신 (구조·스테이지 연결 변경 시)

**스테이지 연결:** `picture-stages.data.ts` — `puzzleSetId: 'slime_50x50'`

---

**폴더 안내:** [content-source/README.md](../README.md)
