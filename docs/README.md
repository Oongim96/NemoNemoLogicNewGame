# docs — 프로젝트 문서

코드(`src/`)와 **분리된** 설계·스펙 문서. 폴더마다 README로 역할을 구분합니다.

| 폴더 | README | 누가 읽나 | 내용 |
| --- | --- | --- | --- |
| **[spec/](./spec/)** | [spec/README.md](./spec/README.md) | 개발·AI | 구현 규칙·수치·플로우·모듈 매핑 |
| **[game-design/](./game-design/)** | [game-design/README.md](./game-design/README.md) | 기획·디자인 | 플레이 경험·UX·세계관 (01~12) |

## 세 문서 계층

```txt
docs/game-design/     “왜, 어떤 느낌” (플레이어-facing)
docs/spec/            “어떻게 구현” (코드·수치 단일 기준)
content-source/       “편집용 원본” (CSV·마스터 MD)
```

## 수정 시 동기화

- gameplay·수치 변경 → `spec/` + 코드 + (필요 시) `game-design/`
- 카드 밸런스 → `content-source/cards/*.csv` → `npm run sync-data`
- 폴더 구조·역할 변경 → **해당 폴더 README** 갱신

**Cursor 규칙:** [.cursor/rules/design-spec-sync.mdc](../.cursor/rules/design-spec-sync.mdc)
