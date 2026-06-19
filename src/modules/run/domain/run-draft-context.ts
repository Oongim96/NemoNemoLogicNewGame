/** 드래프트 서비스가 필요로 하는 런 컨텍스트 (전체 RunState와 분리) */
export interface RunDraftContext {
  readonly completedCount: number;
  hasDraftedBefore(): boolean;
  markDraftOpened(): void;
}
