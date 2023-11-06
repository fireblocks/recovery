import { createContext, useContext, useEffect, ReactNode } from 'react';
import { z } from 'zod';
import { getLogger, settingsInput, useWrappedState } from '@fireblocks/recovery-shared';
import { restoreSettings as ipcRestoreSettings, saveSettings as ipcSaveSettings } from '../lib/ipc';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';

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

const logger = getLogger(LOGGER_NAME_UTILITY);

type Props = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const [settings, setSettings] = useWrappedState<Settings>('util-settings', defaultValue);

  useEffect(() => {
    ipcRestoreSettings().then((data) => setSettings((prev) => ({ ...prev, ...data })));
  }, []);

  const saveSettings = async (data: Settings) => {
    logger.debug('Saving settings via IPC', data);

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
