import type { AssetEntry, RemoteAssetManifest } from '@modules/asset/domain/asset.types';

/** Vite env — 배포 시 CDN 루트. 로컬은 / (public) */
export function getAssetCdnBase(): string {
  const base = import.meta.env.VITE_ASSET_CDN_BASE as string | undefined;
  if (base) return base.endsWith('/') ? base : `${base}/`;
  return '/';
}

/**
 * key → 실제 fetch URL.
 * remote + 캐시 hit 시 blob/object URL, miss 시 CDN URL.
 */
export class AssetLocator {
  constructor(
    private cdnBase: string,
    private cachedUrlByKey: ReadonlyMap<string, string> = new Map(),
  ) {}

  resolve(entry: AssetEntry): string {
    if (entry.source === 'bundled') {
      const path = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
      return `/${path}`;
    }

    const cached = this.cachedUrlByKey.get(entry.key);
    if (cached) return cached;

    const path = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
    return `${this.cdnBase}${path}`;
  }

  resolveManifestUrl(manifestPath: string): string {
    if (manifestPath.startsWith('http://') || manifestPath.startsWith('https://')) {
      return manifestPath;
    }
    const path = manifestPath.startsWith('/') ? manifestPath.slice(1) : manifestPath;
    return `${this.cdnBase}${path}`;
  }

  manifestToEntries(manifest: RemoteAssetManifest): AssetEntry[] {
    const base = manifest.baseUrl ?? `${this.cdnBase}packs/${manifest.packId}/`;
    const prefix = base.endsWith('/') ? base : `${base}/`;

    return manifest.files.map((f) => ({
      key: f.key,
      kind: f.kind,
      packId: manifest.packId,
      path: f.path.startsWith('http') ? f.path : `${prefix}${f.path.replace(/^\//, '')}`,
      source: 'remote' as const,
      frameConfig: f.frameConfig,
    }));
  }
}
