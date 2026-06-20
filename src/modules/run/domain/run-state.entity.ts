import { DEFAULT_PARTY, type PartyConfig } from '@modules/party';
import { cardRepository } from '@modules/card';
import { InkDeck } from '@modules/deck';
import {
  collectPassiveModifiers,
  getConceptStarterCards,
  type PuzzleRunCarryover,
  type PuzzleRunModifiers,
} from '@modules/effects';
import {
  generateRunSectionAssignments,
  resolveSectionReward,
} from '@modules/reward/domain/reward-roll.service';
import type { SectionAssignment, SectionReward, SectionRewardCategory } from '@modules/reward';
import type { RunProgress, SectionStatus } from '@modules/run/domain/run.types';
import type { RunDraftContext } from '@modules/run/domain/run-draft-context';

export interface RunStartOptions {
  mapSize?: number;
  party?: PartyConfig;
}

export class RunState implements RunDraftContext {
  private progress: RunProgress;
  private deck: InkDeck;
  private party: PartyConfig;
  private draftOpened = false;
  private hp = 10;
  private sectionAssignments: SectionAssignment[];
  private resolvedRewards = new Map<number, SectionReward>();
  private puzzleModifiers: PuzzleRunModifiers = { mistakeHpReduce: 0, inkMaxStackBonus: 0 };
  private carryover: PuzzleRunCarryover = {
    inkStackSeed: 0,
    attackStackBonus: 0,
    puzzleComboMax: 0,
  };
  private ultUsesThisSection = 1;

  constructor(options?: RunStartOptions) {
    const mapSize = options?.mapSize ?? 3;
    this.progress = {
      mapSize,
      completedSections: [],
      gold: 0,
      mistakes: 0,
    };
    this.party = options?.party ?? DEFAULT_PARTY;
    this.deck = new InkDeck();
    const sectionCount = mapSize * mapSize;
    this.sectionAssignments = generateRunSectionAssignments(sectionCount, mapSize);
    this.initStartingDeck();
    this.refreshPuzzleModifiers();
  }

  static createFresh(options?: RunStartOptions): RunState {
    return new RunState(options);
  }

  private initStartingDeck(): void {
    for (const id of ['start_001', 'start_002']) {
      const card = cardRepository.getCardById(id);
      if (card) this.deck.add(card);
    }

    const member = this.party.members[0];
    if (member) {
      for (const id of getConceptStarterCards(member.primaryConcept)) {
        const card = cardRepository.getCardById(id);
        if (card) this.deck.add(card);
      }
    }
  }

  refreshPuzzleModifiers(): void {
    this.puzzleModifiers = collectPassiveModifiers(this.deck);
  }

  getPuzzleModifiers(): Readonly<PuzzleRunModifiers> {
    return this.puzzleModifiers;
  }

  getCarryover(): Readonly<PuzzleRunCarryover> {
    return this.carryover;
  }

  getUltUsesThisSection(): number {
    return this.ultUsesThisSection;
  }

  resetSectionUlt(): void {
    this.ultUsesThisSection = 1;
  }

  consumeUlt(): boolean {
    if (this.ultUsesThisSection <= 0) return false;
    this.ultUsesThisSection--;
    return true;
  }

  applyPuzzleEffectResult(result: {
    heal?: number;
    gold?: number;
    inkStackDelta?: number;
    attackStackDelta?: number;
  }): void {
    if (result.heal) this.heal(result.heal);
    if (result.gold) this.addGold(result.gold);
    if (result.inkStackDelta) this.carryover.inkStackSeed += result.inkStackDelta;
    if (result.attackStackDelta) this.carryover.attackStackBonus += result.attackStackDelta;
  }

  getProgress(): Readonly<RunProgress> {
    return this.progress;
  }

  getDeck(): InkDeck {
    return this.deck;
  }

  getParty(): PartyConfig {
    return this.party;
  }

  getHp(): number {
    return this.hp;
  }

  get mapSize(): number {
    return this.progress.mapSize;
  }

  hasDraftedBefore(): boolean {
    return this.draftOpened;
  }

  markDraftOpened(): void {
    this.draftOpened = true;
  }

  isSectionCompleted(sectionIndex: number): boolean {
    return this.progress.completedSections.includes(sectionIndex);
  }

  get completedCount(): number {
    return this.progress.completedSections.length;
  }

  get sectionCount(): number {
    return this.progress.mapSize * this.progress.mapSize;
  }

  isRunComplete(): boolean {
    return this.completedCount >= this.sectionCount;
  }

  getSectionStatus(sectionIndex: number): SectionStatus {
    if (this.isSectionCompleted(sectionIndex)) return 'completed';
    return 'available';
  }

  getSectionCategory(sectionIndex: number): SectionRewardCategory {
    return this.sectionAssignments[sectionIndex]?.category ?? 'draft';
  }

  resolveSectionReward(sectionIndex: number): SectionReward {
    const cached = this.resolvedRewards.get(sectionIndex);
    if (cached) return cached;

    const assignment = this.sectionAssignments[sectionIndex];
    const reward = assignment
      ? resolveSectionReward(assignment)
      : resolveSectionReward({ category: 'draft', draftReward: { type: 'draft', goldAmount: 10 } });

    this.resolvedRewards.set(sectionIndex, reward);
    return reward;
  }

  completeSection(sectionIndex: number): void {
    if (this.isSectionCompleted(sectionIndex)) return;
    this.progress.completedSections.push(sectionIndex);
    this.progress.completedSections.sort((a, b) => a - b);
    this.progress.gold += 10;
  }

  addMistake(hpLoss = 1, characterHpMult = 1): void {
    let reduced = Math.max(0, hpLoss - this.puzzleModifiers.mistakeHpReduce);
    reduced = Math.ceil(reduced * characterHpMult);
    this.progress.mistakes += 1;
    if (reduced > 0) this.hp = Math.max(0, this.hp - reduced);
  }

  refundSectionMistakes(count: number): void {
    this.progress.mistakes = Math.max(0, this.progress.mistakes - count);
    this.heal(count);
  }

  addGold(amount: number): void {
    this.progress.gold += amount;
  }

  spendGold(amount: number): boolean {
    if (this.progress.gold < amount) return false;
    this.progress.gold -= amount;
    return true;
  }

  heal(amount: number): void {
    this.hp = Math.min(10, this.hp + amount);
  }

  updateComboMax(combo: number): void {
    if (combo > this.carryover.puzzleComboMax) this.carryover.puzzleComboMax = combo;
  }
}
