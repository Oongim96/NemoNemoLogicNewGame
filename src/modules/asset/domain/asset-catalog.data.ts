import type { AssetEntry, AssetPack } from '@modules/asset/domain/asset.types';

/**
 * 에셋 카탈로그 — 코드는 key만 사용, 경로·출처는 여기서만 정의.
 * 원격 팩은 manifest로 확장; 지금은 bundled 위주 + remote 팩 스텁.
 */
export const ASSET_PACKS: AssetPack[] = [
  {
    id: 'core',
    label: '필수 리소스',
    required: true,
    source: 'bundled',
    version: '1',
  },
  {
    id: 'characters',
    label: '캐릭터 일러스트',
    required: false,
    source: 'remote',
    manifestUrl: 'packs/characters/manifest.json',
    version: '0',
  },
  {
    id: 'cards',
    label: '카드 일러스트',
    required: false,
    source: 'remote',
    manifestUrl: 'packs/cards/manifest.json',
    version: '0',
  },
];

/** core 팩 — 앱에 포함. 파일 추가 시 여기만 등록 */
export const CORE_ASSET_ENTRIES: AssetEntry[] = [
  // 예시: public/assets/core/ui/logo.png 추가 후 주석 해제
  // {
  //   key: 'ui_logo',
  //   kind: 'image',
  //   packId: 'core',
  //   path: 'assets/core/ui/logo.png',
  //   source: 'bundled',
  // },
];

export function getPack(packId: string): AssetPack | undefined {
  return ASSET_PACKS.find((p) => p.id === packId);
}

export function getRequiredPacks(): AssetPack[] {
  return ASSET_PACKS.filter((p) => p.required);
}

export function getBundledEntriesForPack(packId: string): AssetEntry[] {
  if (packId === 'core') return CORE_ASSET_ENTRIES;
  return [];
}
