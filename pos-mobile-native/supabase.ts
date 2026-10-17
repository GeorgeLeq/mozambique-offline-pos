import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
// We recommend configuring these in your Expo app's app.json / EAS secrets or an .env file
export const SUPABASE_URL = 'https://myitwyrowzzvrfjkbmti.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15aXR3eXJvd3p6dnJmamtibXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzgzNDMsImV4cCI6MjA4OTQxNDM0M30.PNQntdY4oz_l_jSlmWG5i8s-LDSUSP2Jid9w86Wxlh8';

// In-memory fallback if AsyncStorage is unavailable or throws (e.g. native module not linked or web environments)
const memoryStorage: Record<string, string> = {};

const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (!AsyncStorage) return memoryStorage[key] || null;
      return await AsyncStorage.getItem(key);
    } catch (error: any) {
      console.warn('AsyncStorage.getItem failed, falling back to memory:', error?.message);
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (!AsyncStorage) {
        memoryStorage[key] = value;
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error: any) {
      console.warn('AsyncStorage.setItem failed, falling back to memory:', error?.message);
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (!AsyncStorage) {
        delete memoryStorage[key];
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error: any) {
      console.warn('AsyncStorage.removeItem failed, falling back to memory:', error?.message);
      delete memoryStorage[key];
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
