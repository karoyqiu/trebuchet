export default class SimpleQueue<T> {
  private items: T[] = [];
  private waiters: ((value: void | PromiseLike<void>) => void)[] = [];

  public get length() {
    return this.items.length;
  }

  public enqueue(item: T) {
    this.items.push(item);
  }

  public dequeue() {
    const item = this.items.shift();

    this.clearWaiters();

    return item;
  }

  public remove(item: T) {
    const index = this.items.indexOf(item);

    if (index !== -1) {
      this.items.splice(index, 1);
      this.clearWaiters();
    }
  }

  public waitForAvailable(capacity: number) {
    return new Promise<void>((resolve) => {
      if (this.items.length < capacity) {
        resolve();
      } else {
        this.waiters.push(resolve);
      }
    });
  }

  private clearWaiters() {
    if (this.waiters.length > 0) {
      const waiters = this.waiters.splice(0);

      for (const w of waiters) {
        w();
      }
    }
  }
}
