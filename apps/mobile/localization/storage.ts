import { getReadyDatabase } from '../database/lifecycle';
import type { DatabaseConnection } from '../database/types';
import { DEFAULT_LANGUAGE, isLanguage, type Language } from './core';
export const LANGUAGE_PREFERENCE_KEY = 'interface_language';
export interface LanguageStorage { load(): Promise<Language>; save(language: Language): Promise<void> }
/** Device-wide, available before profile selection. Reuses the existing SQLite store. */
export function createLanguageStorage(database = getReadyDatabase): LanguageStorage {
  return {
    async load() {
      const db: DatabaseConnection = await database();
      const row = await db.getFirstAsync<{ state_value: string }>('SELECT state_value FROM local_app_state WHERE state_key = ?;', [LANGUAGE_PREFERENCE_KEY]);
      return isLanguage(row?.state_value) ? row.state_value : DEFAULT_LANGUAGE;
    },
    async save(language) {
      const db = await database();
      await db.runAsync('INSERT INTO local_app_state (state_key, state_value) VALUES (?, ?) ON CONFLICT(state_key) DO UPDATE SET state_value = excluded.state_value;', [LANGUAGE_PREFERENCE_KEY, language]);
    },
  };
}
export const languageStorage = createLanguageStorage();
