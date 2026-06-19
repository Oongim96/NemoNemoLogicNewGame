import { DEFAULT_PARTY } from '@modules/party';
import { MAP_SIZE, SECTION_COUNT } from '@modules/puzzle';
import { cardRepository } from '@modules/card';
import { InkDeck } from '@modules/deck';
import {
  generateRunSectionAssignments,
  resolveSectionReward,
} from '@modules/reward/domain/reward-roll.service';
import type { SectionAssignment, SectionReward, SectionRewardCategory } from '@modules/reward';
import type { PartyConfig } from '@modules/party';
import type { RunProgress, SectionStatus } from '@modules/run/domain/run.types';
import type { RunDraftContext } from '@modules/run/domain/run-draft-context';

export class RunState implements RunDraftContext {
  private progress: RunProgress;
  private deck: InkDeck;
  private party: PartyConfig;
  private draftOpened = false;
  private hp = 10;
  private sectionAssignments: SectionAssignment[];
  private resolvedRewards = new Map<number, SectionReward>();

  constructor() {
    this.progress = {
      mapSize: MAP_SIZE,
      completedSections: [],
      gold: 0,
      mistakes: 0,
    };
    this.party = DEFAULT_PARTY;
    this.deck = new InkDeck();
    this.sectionAssignments = generateRunSectionAssignments(SECTION_COUNT, MAP_SIZE);
    this.initStartingDeck();
  }

  static createFresh(): RunState {
    return new RunState();
  }

  private initStartingDeck(): void {
    for (const id of ['start_001', 'start_002']) {
      const card = cardRepository.getCardById(id);
      if (card) this.deck.add(card);
    }
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

  isRunComplete(): boolean {
    return this.completedCount >= SECTION_COUNT;
  }

  getSectionStatus(sectionIndex: number): SectionStatus {
    if (this.isSectionCompleted(sectionIndex)) return 'completed';
    return 'available';
  }

  /** 맵 타일 표시용 (3종) */
  getSectionCategory(sectionIndex: number): SectionRewardCategory {
    return this.sectionAssignments[sectionIndex]?.category ?? 'draft';
  }

  /** 구역 클리어 시 실제 보상 (이벤트 구역은 이때 세부 롤) */
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

  addMistake(): void {
    this.progress.mistakes += 1;
    this.hp = Math.max(0, this.hp - 1);
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
}
