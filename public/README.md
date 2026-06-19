# public — 정적 파일 (Vite 루트)

빌드 시 **그대로** `dist/`에 복사됩니다. URL은 `/파일명` (예: `/assets/core/ui/logo.png`).

| 하위 | 용도 |
| --- | --- |
| [assets/](./assets/) | 이미지·오디오·에셋 팩 manifest |

게임 코드는 `modules/asset`의 **Phaser key**로만 참조합니다. 경로 직접 하드코딩 금지.

**관련 문서:** [docs/spec/05-assets.md](../docs/spec/05-assets.md)
