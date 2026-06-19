# 05. 에셋 · 원격 다운로드

## 원칙

1. **씬·UI는 Phaser key만 사용** — 경로·CDN URL은 `modules/asset/` 에만
2. **팩(pack) 단위** — 스토어·이벤트·패치는 팩으로 배포
3. **bundled vs remote**
   - `core`: 앱 빌드에 포함 (`public/assets/core/`)
   - `characters`, `cards` 등: CDN manifest + 추후 캐시

## 디렉터리

```txt
public/assets/
  core/                 # 필수 번들 (항상 포함)
  packs/
    characters/
      manifest.json       # 원격과 동일 스키마 (로컬 스텁)
    cards/
      manifest.json
```

배포 CDN 예: `VITE_ASSET_CDN_BASE=https://cdn.example.com/nemo/`

## 코드

| | 경로 |
| --- | --- |
| 카탈로그 | `modules/asset/domain/asset-catalog.data.ts` |
| URL resolve | `modules/asset/infrastructure/asset-locator.ts` |
| 캐시 (스텁) | `modules/asset/infrastructure/asset-cache.repository.ts` |
| Phaser 로드 | `modules/asset/infrastructure/phaser-asset-bridge.ts` |
| 오케스트레이션 | `modules/asset/application/asset-loader.service.ts` |

## 플로우

```txt
BootScene.preload
  → AssetLoaderService.loadRequired()  # core 팩
LoadingScene
  → (선택) ensurePack('characters')   # 도감 진입 전
가챠/스토어 UI (추후)
  → manifest.version 비교 → downloadPack → 캐시 → load
```

## manifest 스키마

```json
{
  "packId": "characters",
  "version": "1.0.0",
  "baseUrl": "https://cdn.../packs/characters/",
  "files": [
    { "key": "char_luna_portrait", "kind": "image", "path": "luna.png", "hash": "sha256..." }
  ]
}
```

## 새 에셋 추가

1. **번들**: `public/assets/core/...` 에 파일 → `CORE_ASSET_ENTRIES` 등록
2. **원격 팩**: CDN에 manifest + 파일 → `ASSET_PACKS` 에 pack 정의
3. 씬: `this.add.image(x, y, 'ui_logo')` 처럼 **key만** 사용

## 미구현

- `downloadPack` 실제 fetch + IndexedDB/Capacitor 저장
- 스토어 UI (용량·Wi‑Fi only)
- manifest hash 검증
