import type { PackLoadState, PackStatus, RemoteAssetManifest } from '@modules/asset/domain/asset.types';

/**
 * 원격 팩 메타·파일 캐시 (추후 IndexedDB / Capacitor Filesystem).
 * 지금은 메모리 + localStorage에 버전만 기록하는 스텁.
 */
export class AssetCacheRepository {
  private memory = new Map<string, string>();
  private state = new Map<string, PackLoadState>();

  getPackState(packId: string): PackLoadState {
    return this.state.get(packId) ?? 'missing';
  }

  setPackState(packId: string, state: PackLoadState): void {
    this.state.set(packId, state);
  }

  getCachedUrl(assetKey: string): string | undefined {
    return this.memory.get(assetKey);
  }

  setCachedUrl(assetKey: string, objectUrl: string): void {
    this.memory.set(assetKey, objectUrl);
  }

  getCachedUrlMap(): ReadonlyMap<string, string> {
    return this.memory;
  }

  getInstalledVersion(packId: string): string | null {
    try {
      return localStorage.getItem(`asset_pack_${packId}_version`);
    } catch {
      return null;
    }
  }

  setInstalledVersion(packId: string, version: string): void {
    try {
      localStorage.setItem(`asset_pack_${packId}_version`, version);
    } catch {
      // ignore — private mode 등
    }
  }

  needsDownload(packId: string, manifest: RemoteAssetManifest): boolean {
    const installed = this.getInstalledVersion(packId);
    return installed !== manifest.version;
  }

  getStatus(packId: string): PackStatus {
    return {
      packId,
      state: this.getPackState(packId),
      version: this.getInstalledVersion(packId) ?? undefined,
    };
  }

  /** 추후: manifest.files 순회하며 fetch → cache 저장 */
  async downloadPack(_manifest: RemoteAssetManifest, _onProgress?: (p: number) => void): Promise<void> {
    // 스텁 — CDN 연동 시 구현
    throw new Error('Remote pack download not implemented yet');
  }
}
