import { useState, useCallback } from 'react';
import { AppSettings } from '../types';

const STORAGE_KEY = 'tomarkdown_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  overwrite: true,
  concurrency: 4,
  customExecutablePath: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err);
    }
  }, []);

  return { settings, saveSettings };
}
