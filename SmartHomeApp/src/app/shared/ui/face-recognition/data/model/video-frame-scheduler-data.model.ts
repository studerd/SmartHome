export interface VideoFrameScheduler {
  mode: 'rvfc' | 'raf';

  schedule(cb: (ts: number) => void): number;

  cancel(id: number): void;
}
