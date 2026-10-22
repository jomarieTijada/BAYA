import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { localLearnerService } from '../../database/services/localLearnerService';
import { CloudServicesContext, pendingCloudServices, type CloudServices } from './services';
import { readCloudConfig } from './config';
import { createSupabaseServices } from './supabaseAdapter';
import { readProgressSnapshot } from '../progress/localProgressSnapshot';

const storage = {
  getItem: (key: string) => Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.localStorage.getItem(key) : null)
    : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => Platform.OS === 'web'
    ? window.localStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => Platform.OS === 'web'
    ? window.localStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};
let services: CloudServices | undefined;
const clients = new Map<string, SupabaseClient>();
function configuredServices(): CloudServices {
  if (services) return services;
  try {
    const config = readCloudConfig(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    if (!config) return pendingCloudServices;
    const namespace = `baya.${new URL(config.url).hostname}`;
    const getClient = (key: string) => {
      let client = clients.get(key);
      if (!client) {
        client = createClient(config.url, config.key, { auth: { storage, storageKey: `${namespace}.${key}`,
          ...(Platform.OS !== 'web' ? { lock: processLock } : {}),
          persistSession: true, autoRefreshToken: Platform.OS === 'web' || AppState.currentState === 'active', detectSessionInUrl: false } });
        clients.set(key, client);
      }
      return client;
    };
    services = createSupabaseServices({ mentor: getClient('mentor.auth'),
      learnerClient: id => getClient(`learner.${id}.auth`),
      recoveryClient: () => createClient(config.url, config.key, { auth: {
        storageKey: 'baya.recovery.ephemeral', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }),
      activeLearner: () => localLearnerService.getActiveLearner(),
      bindLearner: (id, userId) => localLearnerService.bindCloudIdentity(id, userId),
      progressSnapshot: readProgressSnapshot,
    });
    return services;
  } catch {
    // Never print credentials or create a fake fallback session.
    return pendingCloudServices;
  }
}
export function CloudProvider({ children }: React.PropsWithChildren) {
  const value = configuredServices();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', state => {
      for (const client of clients.values()) {
        if (state === 'active') client.auth.startAutoRefresh();
        else client.auth.stopAutoRefresh();
      }
    });
    return () => { subscription.remove(); for (const client of clients.values()) client.auth.stopAutoRefresh(); };
  }, []);
  return <CloudServicesContext.Provider value={value}>{children}</CloudServicesContext.Provider>;
}
