import { getLogger, useWrappedState } from '@fireblocks/recovery-shared';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { z } from 'zod';

export const settingsInput = z.object({
  rpcURLs: z.array(
    z.object({
      assetId: z.string(),
      rpcURL: z.string(),
    }),
  ),
});

export type SettingsInput = z.infer<typeof settingsInput>;

type Settings = z.infer<typeof settingsInput>;

interface ISettingsContext extends Settings {
  saveSettings: (settings: Settings) => Promise<void>;
}

const defaultValue: ISettingsContext = {
  rpcURLs: [],
  saveSettings: async () => undefined,
};

const logger = getLogger(LOGGER_NAME_RELAY);

export const defaultSettings = defaultValue;

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const [settings, setSettings] = useWrappedState<Settings>('relay-settings', defaultValue);

  useEffect(() => {
    const storedSettings = window.localStorage.getItem('settings');

    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const saveSettings = async (data: Settings) => {
    logger.info('Storing new settings', data);
    window.localStorage.setItem('settings', JSON.stringify(data));
  };

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value: ISettingsContext = {
    ...settings,
    saveSettings,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useSettings = () => useContext(Context);
