import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { z } from 'zod';
import { settingsInput } from '@fireblocks/recovery-shared';
import { restoreSettings as ipcRestoreSettings, saveSettings as ipcSaveSettings } from '../lib/ipc';

type Settings = z.infer<typeof settingsInput>;

interface ISettingsContext extends Settings {
  saveSettings: (settings: Settings) => Promise<void>;
}

const defaultValue: ISettingsContext = {
  relayBaseUrl: '',
  idleMinutes: 10,
  saveSettings: async () => undefined,
};

export const defaultSettings = defaultValue;

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const [settings, setSettings] = useState<Settings>(defaultValue);

  useEffect(() => {
    ipcRestoreSettings().then((data) => setSettings((prev) => ({ ...prev, ...data })));
  }, []);

  const saveSettings = async (data: Settings) => {
    await ipcSaveSettings(data);

    setSettings((prev) => ({ ...prev, ...data }));
  };

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value: ISettingsContext = {
    ...settings,
    saveSettings,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useSettings = () => useContext(Context);
