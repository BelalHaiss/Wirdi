/**
 * Simple side effects queue for deferring actions (like notifications)
 * until after database transactions complete.
 */
export class SideEffectsQueue {
  private queue: Array<() => Promise<void>> = [];

  add(effect: () => Promise<void>): void {
    this.queue.push(effect);
  }

  async executeAll(): Promise<void> {
    await Promise.allSettled(this.queue.map((fn) => fn()));
    this.queue = [];
  }
}
