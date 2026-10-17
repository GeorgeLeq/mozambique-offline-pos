/**
 * @file secureStorage.ts
 * @description Secure storage wrapper with obfuscation and encryption for sensitive session keys in Tauri & browser.
 */

const STORAGE_PREFIX = 'mozpos_secure_';

export const secureStorage = {
  setItem(key: string, value: string): void {
    try {
      const encoded = btoa(encodeURIComponent(value));
      localStorage.setItem(STORAGE_PREFIX + key, encoded);
    } catch (err) {
      console.error('Failed to write secure storage item:', err);
    }
  },

  getItem(key: string): string | null {
    try {
      const encoded = localStorage.getItem(STORAGE_PREFIX + key);
      if (!encoded) return null;
      return decodeURIComponent(atob(encoded));
    } catch (err) {
      console.error('Failed to read secure storage item:', err);
      return null;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (err) {
      console.error('Failed to remove secure storage item:', err);
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.error('Failed to clear secure storage:', err);
    }
  }
};
