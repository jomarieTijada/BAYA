import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { DEFAULT_LANGUAGE, formatDate, formatNumber, learnerCount, translate, translateText, type Language, type Variables } from './core';
import type { MessageKey } from './en';
import { languageStorage, type LanguageStorage } from './storage';
function translators(language: Language) {
  return {
    language,
    t: (key: MessageKey, values?: Variables) => translate(language, key, values),
    text: (source: string) => translateText(language, source),
    date: (value: Date | string, options?: Intl.DateTimeFormatOptions) => formatDate(language, value, options),
    number: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(language, value, options),
    learners: (count: number) => learnerCount(language, count),
  };
}
const LocalizationContext = createContext({ ...translators(DEFAULT_LANGUAGE), ready: true, saveError: false, setLanguage: (_language: Language) => {} });
export function LocalizationProvider({ children, storage = languageStorage }: React.PropsWithChildren<{ storage?: LanguageStorage }>) {
  const [language, updateLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const writes = useRef(Promise.resolve());
  const revision = useRef(0);
  useEffect(() => {
    let active = true;
    void storage.load().then(value => { if (active) updateLanguage(value); }).catch(() => { if (active) setSaveError(true); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [storage]);
  const setLanguage = useCallback((value: Language) => {
    if (!ready) return;
    updateLanguage(value);
    setSaveError(false);
    const current = ++revision.current;
    // Serialize writes so rapid taps cannot persist an older selection last.
    writes.current = writes.current.catch(() => {}).then(() => storage.save(value)).catch(() => {
      if (revision.current === current) setSaveError(true);
    });
  }, [ready, storage]);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);
  const value = useMemo(() => ({ ...translators(language), ready, saveError, setLanguage }), [language, ready, saveError, setLanguage]);
  return <LocalizationContext.Provider value={value}>{ready ? children : null}</LocalizationContext.Provider>;
}
export const useLocalization = () => useContext(LocalizationContext);
