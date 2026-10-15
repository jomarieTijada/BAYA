import { DatabaseOwnershipController } from '../ownership';

type Request = {
  callback: (lock: Lock) => Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
  signal?: AbortSignal;
};

class FakeLocks {
  held = false;
  pending: Request[] = [];

  request(_name: string, options: LockOptions, callback: (lock: Lock) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const request: Request = { callback, resolve, reject, signal: options.signal };
      this.pending.push(request);
      options.signal?.addEventListener('abort', () => {
        this.pending = this.pending.filter((item) => item !== request);
        reject(new Error('Aborted'));
      });
      this.pump();
    });
  }

  private pump(): void {
    if (this.held || this.pending.length === 0) return;
    const request = this.pending.shift()!;
    this.held = true;
    void request.callback({ name: 'baya_sqlite_opfs', mode: 'exclusive' } as Lock)
      .then(() => {
        this.held = false;
        request.resolve();
        this.pump();
      }, request.reject);
  }

  query(): Promise<LockManagerSnapshot> {
    return Promise.resolve({
      held: this.held ? [{ name: 'baya_sqlite_opfs', mode: 'exclusive' }] : [],
      pending: this.pending.map(() => ({ name: 'baya_sqlite_opfs', mode: 'exclusive' })),
    } as LockManagerSnapshot);
  }
}

class FakeBroadcastChannel {
  static channels: FakeBroadcastChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(readonly name: string) {
    FakeBroadcastChannel.channels.push(this);
  }

  postMessage(data: unknown): void {
    for (const channel of FakeBroadcastChannel.channels) {
      if (channel !== this && channel.name === this.name) {
        queueMicrotask(() => channel.onmessage?.({ data } as MessageEvent));
      }
    }
  }
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 70));

describe('OPFS ownership lifetime', () => {
  let locks: FakeLocks;

  beforeEach(() => {
    locks = new FakeLocks();
    FakeBroadcastChannel.channels = [];
    Object.defineProperty(navigator, 'locks', { configurable: true, value: locks });
    Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: FakeBroadcastChannel });
  });

  it('holds the Web Lock until explicit release, including after acquire resolves', async () => {
    const owner = new DatabaseOwnershipController();
    await owner.acquire();
    expect(owner.hasOwnership()).toBe(true);
    expect(locks.held).toBe(true);
    await tick();
    expect(locks.held).toBe(true);
    await owner.release();
    expect(locks.held).toBe(false);
  });

  it('keeps a second context waiting and grants it only after owner release', async () => {
    const owner = new DatabaseOwnershipController();
    const waiter = new DatabaseOwnershipController();
    owner.setYieldHandler(async () => {});
    await owner.acquire();
    const waiting = waiter.acquire();
    await tick();
    expect(waiter.hasOwnership()).toBe(false);
    expect(locks.pending).toHaveLength(1);
    await owner.release();
    await waiting;
    expect(waiter.hasOwnership()).toBe(true);
    await waiter.release();
  });

  it('waits for the owner close handler before granting a BroadcastChannel requester', async () => {
    const owner = new DatabaseOwnershipController();
    const waiter = new DatabaseOwnershipController();
    let finishClose!: () => void;
    const closing = new Promise<void>((resolve) => { finishClose = resolve; });
    owner.setYieldHandler(async () => {
      await closing;
      await owner.release();
    });
    await owner.acquire();
    const waiting = waiter.acquire();
    await tick();
    expect(owner.getState()).toBe('yielding');
    expect(waiter.hasOwnership()).toBe(false);
    finishClose();
    await waiting;
    expect(waiter.hasOwnership()).toBe(true);
    await waiter.release();
  });

  it('cancels a waiting request without opening a second owner', async () => {
    const owner = new DatabaseOwnershipController();
    const waiter = new DatabaseOwnershipController();
    owner.setYieldHandler(async () => {});
    await owner.acquire();
    const pending = waiter.acquire();
    await tick();
    waiter.cancelPending();
    await expect(pending).rejects.toThrow('Aborted');
    expect(waiter.hasOwnership()).toBe(false);
    expect(locks.pending).toHaveLength(0);
    await owner.release();
  });

  it('assigns a distinct session ID to each page controller', () => {
    const first = new DatabaseOwnershipController();
    const second = new DatabaseOwnershipController();
    expect(first.sessionId).not.toBe(second.sessionId);
  });
});
