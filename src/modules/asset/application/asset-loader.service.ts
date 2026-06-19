import type Phaser from 'phaser';
import {
  getBundledEntriesForPack,
  getPack,
  getRequiredPacks,
} from '@modules/asset/domain/asset-catalog.data';
import type { AssetEntry, AssetPack, PackStatus, RemoteAssetManifest } from '@modules/asset/domain/asset.types';
import { AssetCacheRepository } from '@modules/asset/infrastructure/asset-cache.repository';
import { AssetLocator, getAssetCdnBase } from '@modules/asset/infrastructure/asset-locator';
import { queueEntries, runLoader } from '@modules/asset/infrastructure/phaser-asset-bridge';

export interface AssetLoadProgress {
  phase: 'core' | 'pack';
  packId: string;
  label: string;
  progress: number;
}

/**
 * 에셋 로딩 오케스트레이션.
 * - required 팩: Boot/Loading에서 동기 로드
 * - optional 팩: 가챠·도감 진입 전 ensurePack() 호출 (추후 스토어 UI)
 */
export class AssetLoaderService {
  private locator: AssetLocator;
  private readonly cache = new AssetCacheRepository();
  private loadedPacks = new Set<string>();

  constructor(cdnBase = getAssetCdnBase()) {
    this.locator = new AssetLocator(cdnBase);
  }

  getLocator(): AssetLocator {
    return new AssetLocator(getAssetCdnBase(), this.cache.getCachedUrlMap());
  }

  getPackStatus(packId: string): PackStatus {
    return this.cache.getStatus(packId);
  }

  /** Boot: 필수 번들 팩만 Phaser에 적재 */
  async loadRequired(scene: Phaser.Scene, onProgress?: (p: AssetLoadProgress) => void): Promise<void> {
    const packs = getRequiredPacks();

    for (const pack of packs) {
      onProgress?.({
        phase: 'core',
        packId: pack.id,
        label: pack.label,
        progress: 0,
      });

      const entries = getBundledEntriesForPack(pack.id);
      if (entries.length === 0) {
        this.loadedPacks.add(pack.id);
        this.cache.setPackState(pack.id, 'ready');
        onProgress?.({ phase: 'core', packId: pack.id, label: pack.label, progress: 1 });
        continue;
      }

      queueEntries(scene, entries, this.locator);
      await runLoader(scene);
      this.loadedPacks.add(pack.id);
      this.cache.setPackState(pack.id, 'ready');
      onProgress?.({ phase: 'core', packId: pack.id, label: pack.label, progress: 1 });
    }
  }

  /**
   * 옵션 팩 — 캐시 있으면 로컬, 없으면 manifest fetch 후 다운로드 (추후).
   * 지금: manifest가 public에 있으면 URL만 resolve해 로드 시도.
   */
  async ensurePack(
    scene: Phaser.Scene,
    packId: string,
    onProgress?: (p: AssetLoadProgress) => void,
  ): Promise<boolean> {
    if (this.loadedPacks.has(packId)) return true;

    const pack = getPack(packId);
    if (!pack) return false;

    onProgress?.({ phase: 'pack', packId, label: pack.label, progress: 0 });

    let entries: AssetEntry[] = [];

    if (pack.source === 'bundled') {
      entries = getBundledEntriesForPack(packId);
    } else if (pack.manifestUrl) {
      entries = await this.resolveRemotePack(pack);
    }

    if (entries.length === 0) {
      this.cache.setPackState(packId, 'missing');
      onProgress?.({ phase: 'pack', packId, label: pack.label, progress: 1 });
      return false;
    }

    this.cache.setPackState(packId, 'downloading');
    queueEntries(scene, entries, this.locator);
    await runLoader(scene);
    this.loadedPacks.add(packId);
    this.cache.setPackState(packId, 'ready');
    onProgress?.({ phase: 'pack', packId, label: pack.label, progress: 1 });
    return true;
  }

  private async resolveRemotePack(pack: AssetPack): Promise<AssetEntry[]> {
    if (!pack.manifestUrl) return [];

    const manifestUrl = this.locator.resolveManifestUrl(pack.manifestUrl);

    try {
      const res = await fetch(manifestUrl);
      if (!res.ok) return [];
      const manifest = (await res.json()) as RemoteAssetManifest;

      if (this.cache.needsDownload(pack.id, manifest)) {
        // 추후: await this.cache.downloadPack(manifest, onProgress)
        // 지금은 스트리밍 로드만 (캐시 없이 CDN 직접)
      }

      this.cache.setInstalledVersion(pack.id, manifest.version);
      return this.locator.manifestToEntries(manifest);
    } catch {
      return [];
    }
  }
}

/** 싱글톤 — registry에도 넣어 씬에서 공유 */
let instance: AssetLoaderService | null = null;

export function getAssetLoader(): AssetLoaderService {
  if (!instance) instance = new AssetLoaderService();
  return instance;
}

export function resetAssetLoaderForTests(): void {
  instance = null;
}
