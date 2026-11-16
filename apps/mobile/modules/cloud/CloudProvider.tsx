import 'react-native-url-polyfill/auto';
import { MentorSessionRevisionContext } from './mentorSessionRevision';
import React, { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { localLearnerService } from '../../database/services/localLearnerService';
import { CloudServicesContext, pendingCloudServices, type CloudServices } from './services';
import { readCloudConfig } from './config';
import { createSupabaseServices } from './supabaseAdapter';
import { readProgressSnapshot } from '../progress/localProgressSnapshot';

const storage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      } else {
        return null;
      }
    } else {
      return SecureStore.getItemAsync(key);
    }
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      return window.localStorage.setItem(key, value);
    } else {
      return SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      return window.localStorage.removeItem(key);
    } else {
      return SecureStore.deleteItemAsync(key);
    }
  },
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
          ...((() => {
            if (Platform.OS !== 'web') {
              return { lock: processLock };
            } else {
              return {};
            }
          })()),
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
  const [mentorRevision, setMentorRevision] = useState(0);
  useEffect(() => {
    const subscription = clients.get('mentor.auth')?.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') setMentorRevision(n => n + 1);
    }).data.subscription;
    return () => subscription?.unsubscribe();
  }, []);
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
  return <CloudServicesContext.Provider value={value}><MentorSessionRevisionContext.Provider value={mentorRevision}>{children}</MentorSessionRevisionContext.Provider></CloudServicesContext.Provider>;
}
