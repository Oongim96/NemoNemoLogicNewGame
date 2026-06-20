import Phaser from 'phaser';
import type { PlayerProfile } from '@modules/meta/domain/player-profile.entity';
import type { RunState } from '@modules/run/domain/run-state.entity';

/** 런에서 모은 골드를 메타(캐릭터) 골드로 이전 */
export function settleRunGold(profile: PlayerProfile, run: RunState): number {
  const amount = run.getProgress().gold;
  if (amount <= 0) return 0;
  profile.addGold(amount);
  run.spendGold(amount);
  return amount;
}

export function clearRunSession(registry: Phaser.Data.DataManager): void {
  registry.remove('runState');
  registry.remove('currentPicture');
}
