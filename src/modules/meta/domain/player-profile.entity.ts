import type { PartyConfig } from '@modules/party';
import {
  CHARACTER_ROSTER,
  characterToPartyMember,
  getCharacterDef,
} from '@modules/meta/domain/character-roster.data';
import { DEFAULT_SETTINGS, type GameSettings } from '@modules/meta/domain/settings.types';

const DEFAULT_OWNED_CHARACTERS = ['char_luna', 'char_brix', 'char_mio', 'char_sera'];
const DEFAULT_OWNED_CARDS = ['start_001', 'start_002', 'ink_001', 'moon_001', 'wall_001', 'luck_001'];
const DEFAULT_PARTY = ['char_luna', 'char_brix', 'char_mio', 'char_sera'];

export class PlayerProfile {
  private displayName = '모험가';
  private loggedIn = false;
  private ownedCharacterIds = new Set<string>(DEFAULT_OWNED_CHARACTERS);
  private ownedCardIds = new Set<string>(DEFAULT_OWNED_CARDS);
  private partyMemberIds: string[] = [...DEFAULT_PARTY];
  private gems = 1600;
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  static createDefault(): PlayerProfile {
    return new PlayerProfile();
  }

  autoLogin(): void {
    this.loggedIn = true;
    this.displayName = '모험가';
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  getGems(): number {
    return this.gems;
  }

  addGems(amount: number): void {
    this.gems += amount;
  }

  spendGems(amount: number): boolean {
    if (this.gems < amount) return false;
    this.gems -= amount;
    return true;
  }

  ownsCharacter(id: string): boolean {
    return this.ownedCharacterIds.has(id);
  }

  ownsCard(id: string): boolean {
    return this.ownedCardIds.has(id);
  }

  getOwnedCharacterIds(): string[] {
    return [...this.ownedCharacterIds];
  }

  getOwnedCardIds(): string[] {
    return [...this.ownedCardIds];
  }

  addCharacter(id: string): void {
    this.ownedCharacterIds.add(id);
    const cardIds = getCharacterDef(id)?.uniqueCardIds ?? [];
    for (const cardId of cardIds) {
      this.ownedCardIds.add(cardId);
    }
  }

  addCard(id: string): void {
    this.ownedCardIds.add(id);
  }

  getPartyMemberIds(): string[] {
    return [...this.partyMemberIds];
  }

  setPartySlot(slot: number, characterId: string): void {
    if (slot < 0 || slot >= 4) return;
    if (!this.ownsCharacter(characterId)) return;
    const next = [...this.partyMemberIds];
    next[slot] = characterId;
    this.partyMemberIds = next;
  }

  getPartyConfig(): PartyConfig {
    const members = this.partyMemberIds
      .map((id) => getCharacterDef(id))
      .filter((def): def is NonNullable<typeof def> => def != null)
      .map(characterToPartyMember);

    return { members };
  }

  getSettings(): Readonly<GameSettings> {
    return this.settings;
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
  }

  /** 가챠 1회 롤 (젬 소모 없음) */
  rollGachaCharacter(): { characterId: string; grade: 'SR' | 'SSR' } | null {
    const owned = this.getOwnedCharacterIds();
    const ssrPool = CHARACTER_ROSTER.filter((c) => c.grade === 'SSR' && !owned.includes(c.id));
    const srPool = CHARACTER_ROSTER.filter((c) => c.grade === 'SR' && !owned.includes(c.id));

    const roll = Math.random();
    if (roll < 0.15 && ssrPool.length > 0) {
      const pick = ssrPool[Math.floor(Math.random() * ssrPool.length)];
      this.addCharacter(pick.id);
      return { characterId: pick.id, grade: 'SSR' };
    }

    if (srPool.length > 0) {
      const pick = srPool[Math.floor(Math.random() * srPool.length)];
      this.addCharacter(pick.id);
      return { characterId: pick.id, grade: 'SR' };
    }

    if (ssrPool.length > 0) {
      const pick = ssrPool[Math.floor(Math.random() * ssrPool.length)];
      this.addCharacter(pick.id);
      return { characterId: pick.id, grade: 'SSR' };
    }

    this.addGems(30);
    return null;
  }

  /** 가챠 1회 — SR 85% / SSR 15% (와이어) */
  pullGacha(): { characterId: string; grade: 'SR' | 'SSR' } | null {
    if (!this.spendGems(100)) return null;
    return this.rollGachaCharacter();
  }

  pullTenGacha(): { characterId: string; grade: 'SR' | 'SSR' }[] {
    if (!this.spendGems(900)) return [];

    const results: { characterId: string; grade: 'SR' | 'SSR' }[] = [];
    for (let i = 0; i < 10; i++) {
      const r = this.rollGachaCharacter();
      if (r) results.push(r);
    }
    return results;
  }
}
