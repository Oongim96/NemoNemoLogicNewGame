# 구현 스펙 (Implementation Spec)

**코드 구현의 단일 진실 소스.** AI·개발자는 gameplay 로직 변경 시 **이 폴더를 먼저** 본다.

| 문서 | 내용 | 코드 모듈 |
| --- | --- | --- |
| [00-architecture.md](./00-architecture.md) | 레이어·폴더·import 규칙 | `src/app`, `src/modules/*` |
| [01-run-flow.md](./01-run-flow.md) | 앱 진입·런·맵·퍼즐 | `meta`, `run`, `scenes/` |
| [02-rewards.md](./02-rewards.md) | 구역 보상 3종·확률·상점 보장 | `reward` |
| [03-draft.md](./03-draft.md) | 3택1 가중치·파티 시너지 | `draft`, `party`, `card` |
| [04-data-pipeline.md](./04-data-pipeline.md) | CSV→JSON·카드 데이터 | `card`, `data/`, `scripts/` |
| [05-assets.md](./05-assets.md) | 에셋 팩·CDN·원격 다운로드 | `asset`, `public/assets/` |

## 기획 문서와의 관계

| | `docs/game-design/` | `docs/spec/` |
| --- | --- | --- |
| 목적 | 플레이 경험·세계관·밸런스 의도 | **구현 가능한 규칙·수치·흐름** |
| 독자 | 기획·디자인 | 개발·Cursor AI |
| 변경 | UX 의도 바뀔 때 | **코드와 함께** 동기화 |

플레이어-facing 기획은 `docs/game-design/`, 숫자·플로우·모듈 매핑은 `docs/spec/`.
