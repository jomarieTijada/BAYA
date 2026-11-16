import { getReadyDatabase } from '../../database/lifecycle';

export const STORYBOOK_INTRO_KEY = 'baya.storybook.intro.seen.v1';
export interface IntroductionStorage { load(): Promise<boolean>; save(): Promise<void> }

/** Same installation-wide SQLite preferences table used by the language setting. */
export function createIntroductionStorage(database = getReadyDatabase): IntroductionStorage {
  return {
    async load() {
      const db = await database();
      const row = await db.getFirstAsync<{ state_value: string }>('SELECT state_value FROM local_app_state WHERE state_key = ?;', [STORYBOOK_INTRO_KEY]);
      return row?.state_value === 'true';
    },
    async save() {
      const db = await database();
      await db.runAsync('INSERT INTO local_app_state (state_key, state_value) VALUES (?, ?) ON CONFLICT(state_key) DO UPDATE SET state_value = excluded.state_value;', [STORYBOOK_INTRO_KEY, 'true']);
    },
  };
}

export function createIntroductionSession(storage: IntroductionStorage) {
  let acknowledged = false;
  let offered = false;
  let read: Promise<boolean> | undefined;
  let write: Promise<boolean> | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  return {
    load() {
      read ??= storage.load().then(seen => {
        acknowledged ||= seen;
        return acknowledged;
      }).catch(error => {
        console.warn('[BAYA introduction] Could not read acknowledgement; offering once this session.', error);
        return acknowledged;
      });
      return read;
    },
    claim() {
      if (acknowledged || offered) return false;
      offered = true;
      return true;
    },
    acknowledge() {
      acknowledged = true;
      // Session suppression is immediate, even if the persistent write fails.
      write ??= storage.save().then(() => true).catch(error => {
        console.warn('[BAYA introduction] Acknowledgement was NOT saved. It may appear next launch.', error);
        return false;
      });
      return write;
    },
    acceptExternalAcknowledgement() { acknowledged = true; notify(); },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}

export const introductionSession = createIntroductionSession(createIntroductionStorage());
