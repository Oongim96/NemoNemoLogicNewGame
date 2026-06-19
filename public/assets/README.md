# public/assets — 게임 리소스 파일

Phaser·`AssetLoaderService`가 로드하는 **실제 파일** 위치.

```txt
assets/
  core/                 # 필수 번들 (앱에 항상 포함)
  packs/
    characters/         # 캐릭 일러 팩 (원격 manifest 스텁)
      manifest.json
    cards/              # 카드 일러 팩
      manifest.json
```

## bundled vs remote

| 팩 ID | 위치 | 비고 |
| --- | --- | --- |
| `core` | `core/` | `asset-catalog`의 `CORE_ASSET_ENTRIES`에 key 등록 |
| `characters`, `cards` | `packs/*/manifest.json` | CDN 배포 시 동일 스키마 |

로컬 개발: manifest의 `baseUrl`이 `/assets/packs/.../` 를 가리킴.  
배포 CDN: `.env`의 `VITE_ASSET_CDN_BASE`.

## 파일 추가 절차

1. 파일을 `core/` 또는 `packs/<name>/`에 배치
2. `src/modules/asset/domain/asset-catalog.data.ts` 또는 pack `manifest.json`에 등록
3. 씬/UI에서는 **key만** 사용 (`this.add.image(x, y, 'ui_logo')`)

**스펙:** [docs/spec/05-assets.md](../../docs/spec/05-assets.md)
