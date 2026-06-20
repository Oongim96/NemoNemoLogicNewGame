import type { PartyConfig } from '@modules/party';
import {
  executeGachaPull,
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  type GachaPullResult,
} from '@modules/gacha';
import { characterToPartyMember, getCharacterDef } from '@modules/meta/domain/character-roster.data';
import { DEFAULT_SETTINGS, type GameSettings } from '@modules/meta/domain/settings.types';

/** 기본 SR 1인 + 스타터 — 나머지는 가챠 */
const DEFAULT_OWNED_CHARACTERS = ['char_sera'];
const DEFAULT_OWNED_CARDS = ['start_001', 'start_002', 'ink_001', 'ink_002'];
const DEFAULT_SELECTED = 'char_sera';

export class PlayerProfile {
  private displayName = '모험가';
  private level = 1;
  private gold = 710;
  private loggedIn = false;
  private ownedCharacterIds = new Set<string>(DEFAULT_OWNED_CHARACTERS);
  private ownedCardIds = new Set<string>(DEFAULT_OWNED_CARDS);
  private selectedCharacterId = DEFAULT_SELECTED;
  private gems = 4900;
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

  getLevel(): number {
    return this.level;
  }

  getGold(): number {
    return this.gold;
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

  getSelectedCharacterId(): string {
    return this.selectedCharacterId;
  }

  setSelectedCharacter(id: string): void {
    if (!this.ownsCharacter(id)) return;
    this.selectedCharacterId = id;
  }

  getPartyConfig(): PartyConfig {
    const def = getCharacterDef(this.selectedCharacterId);
    if (!def) {
      const fallback = getCharacterDef(DEFAULT_SELECTED)!;
      return { members: [characterToPartyMember(fallback)] };
    }
    return { members: [characterToPartyMember(def)] };
  }

  getSettings(): Readonly<GameSettings> {
    return this.settings;
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
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

  addGold(amount: number): void {
    this.gold += amount;
  }

  spendGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  pullGacha(): GachaPullResult | null {
    if (!this.spendGems(GACHA_COST_SINGLE)) return null;
    return executeGachaPull(this);
  }

  pullTenGacha(): GachaPullResult[] {
    if (!this.spendGems(GACHA_COST_TEN)) return [];

    const results: GachaPullResult[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(executeGachaPull(this));
    }
    return results;
  }
}
