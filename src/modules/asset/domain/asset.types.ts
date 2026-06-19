/** 에셋이 어디서 오는지 */
export type AssetSource = 'bundled' | 'remote';

export type AssetKind = 'image' | 'audio' | 'spritesheet' | 'atlas' | 'json' | 'bitmapFont';

/** Phaser 로더에 등록할 단일 에셋 */
export interface AssetEntry {
  /** Phaser texture/audio key — 씬·UI는 key만 참조 */
  key: string;
  kind: AssetKind;
  packId: string;
  /** 번들: public/ 기준 경로. 원격: CDN manifest 상대 경로 */
  path: string;
  source: AssetSource;
  /** spritesheet / atlas 전용 */
  frameConfig?: { frameWidth: number; frameHeight: number };
}

/** 다운로드·캐시 단위 (스토어 팩, 이벤트 배너 팩 등) */
export interface AssetPack {
  id: string;
  label: string;
  /** 앱 시작 시 반드시 로드 */
  required: boolean;
  source: AssetSource;
  /** 원격 팩: CDN上的 manifest URL (상대 또는 절대) */
  manifestUrl?: string;
  version?: string;
}

export type PackLoadState = 'missing' | 'downloading' | 'cached' | 'ready';

export interface PackStatus {
  packId: string;
  state: PackLoadState;
  version?: string;
  progress?: number;
}

/** 원격 CDN manifest (추후 스토어·패치 서버가 제공) */
export interface RemoteAssetManifest {
  packId: string;
  version: string;
  baseUrl?: string;
  files: RemoteManifestFile[];
}

export interface RemoteManifestFile {
  key: string;
  kind: AssetKind;
  path: string;
  hash?: string;
  size?: number;
  frameConfig?: { frameWidth: number; frameHeight: number };
}
