import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'tms-system-settings';

export interface SystemSettings {
  paginationLimit: number;
  defaultShipmentView: 'grid' | 'tile';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
  showExchangeRate: boolean;
}

const defaults: SystemSettings = {
  paginationLimit: 10,
  defaultShipmentView: 'grid',
  dateFormat: 'MM/DD/YYYY',
  showExchangeRate: true,
};

interface SystemSettingsContextValue {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(null);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaults);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SystemSettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore invalid stored data
    }
  }, []);

  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <SystemSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const ctx = useContext(SystemSettingsContext);
  if (!ctx) {
    return {
      settings: defaults,
      updateSettings: () => {},
    };
  }
  return ctx;
}
