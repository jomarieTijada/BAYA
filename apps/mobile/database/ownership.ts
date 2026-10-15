const LOCK_NAME = 'baya_sqlite_opfs';
const CHANNEL_NAME = 'baya_db_channel';
const OWNERSHIP_WAIT_MS = 8000;

export type OwnershipState = 'idle' | 'acquiring' | 'waiting' | 'owner' | 'yielding' | 'releasing' | 'failed';

export class DatabaseOwnershipController {
  readonly sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

  private state: OwnershipState = 'idle';
  private channel: BroadcastChannel | null = null;
  private acquirePromise: Promise<void> | null = null;
  private lockRequest: Promise<void> | null = null;
  private releaseSignal: (() => void) | null = null;
  private abort: AbortController | null = null;
  private knownOwner: string | null = null;
  private yieldHandler: (() => Promise<void>) | null = null;

  constructor() {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent) => {
        const message = event.data as { type?: string; session?: string };
        if (!message.session || message.session === this.sessionId) return;
        if (message.type === 'OWNER') {
          this.knownOwner = message.session;
          if (this.state === 'waiting') this.log('waiting');
        }
        if (message.type === 'REQUEST_YIELD' && this.state === 'owner') {
          this.channel?.postMessage({ type: 'OWNER', session: this.sessionId });
          this.setState('yielding');
          void this.yieldHandler?.().catch((error) => {
            this.setState('failed');
            console.error('[BAYA DB Owner] Yield failed; retaining Web Lock', error);
          });
        }
      };
    } catch {
      this.channel = null;
    }
  }

  setYieldHandler(handler: () => Promise<void>): void {
    this.yieldHandler = handler;
  }

  getState(): OwnershipState {
    return this.state;
  }

  hasOwnership(): boolean {
    return this.releaseSignal !== null;
  }

  private log(state: OwnershipState): void {
    console.info(`[BAYA DB Owner] session=${this.sessionId} state=${state}${this.knownOwner ? ` owner=${this.knownOwner}` : ''}`);
    if (typeof navigator !== 'undefined' && navigator.locks?.query) {
      void navigator.locks.query().then(({ held, pending }) => {
        const relevant = (locks: LockInfo[]) => locks
          .filter((lock) => lock.name === LOCK_NAME)
          .map((lock) => ({ name: lock.name, mode: lock.mode }));
        console.info('[BAYA DB Owner] locks', JSON.stringify({
          session: this.sessionId,
          state,
          held: relevant(held ?? []),
          pending: relevant(pending ?? []),
        }));
      }).catch(() => {});
    }
  }

  private setState(state: OwnershipState): void {
    this.state = state;
    this.log(state);
  }

  reportDatabaseReady(): void {
    this.log('owner');
  }

  requestOwnershipYield(): void {
    this.channel?.postMessage({ type: 'REQUEST_YIELD', session: this.sessionId });
  }

  async acquire(): Promise<void> {
    if (this.state === 'owner') return;
    if (this.acquirePromise) return this.acquirePromise;
    if (typeof navigator === 'undefined' || !navigator.locks) {
      throw new Error('BAYA requires Web Locks for safe OPFS access in this browser.');
    }

    this.setState('acquiring');
    this.abort = new AbortController();
    const signal = this.abort.signal;
    this.acquirePromise = new Promise<void>((resolve, reject) => {
      let granted = false;
      let timedOut = false;
      const waitingTimer = setTimeout(() => {
        if (!granted) {
          this.setState('waiting');
          this.requestOwnershipYield();
        }
      }, 50);
      const deadline = setTimeout(() => {
        timedOut = true;
        this.abort?.abort();
      }, OWNERSHIP_WAIT_MS);

      this.lockRequest = navigator.locks.request(LOCK_NAME, { mode: 'exclusive', signal }, async () => {
        granted = true;
        clearTimeout(waitingTimer);
        clearTimeout(deadline);
        this.abort = null;
        this.knownOwner = null;
        this.setState('owner');
        resolve();
        await new Promise<void>((release) => {
          this.releaseSignal = release;
        });
      }).catch((error) => {
        clearTimeout(waitingTimer);
        clearTimeout(deadline);
        if (!granted) {
          this.setState('idle');
          if (timedOut) {
            const busy = new Error('Storage is busy in another BAYA window. Close it and try again.');
            (busy as Error & { code: string }).code = 'OPFS_LOCK_CONFLICT';
            reject(busy);
          } else {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        }
      });
    }).finally(() => {
      this.acquirePromise = null;
    });
    return this.acquirePromise;
  }

  cancelPending(): void {
    if (this.state === 'acquiring' || this.state === 'waiting') this.abort?.abort();
  }

  /** Call only after SQLite close and VFS pool disposal have both completed. */
  async release(): Promise<void> {
    if (!this.releaseSignal) return;
    this.setState('releasing');
    this.releaseSignal();
    this.releaseSignal = null;
    await this.lockRequest;
    this.lockRequest = null;
    this.setState('idle');
  }
}

export const databaseOwnership = new DatabaseOwnershipController();
