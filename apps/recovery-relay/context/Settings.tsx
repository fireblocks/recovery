import { getLogger, RelaySettingsInput, settingsInput, useWrappedState } from '@fireblocks/recovery-shared';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { z } from 'zod';
import { defaultRPCs } from '../lib/defaultRPCs';

export type SettingsInput = z.infer<(typeof settingsInput)['RELAY']>;

interface ISettingsContext extends RelaySettingsInput {
  saveSettings: (settings: RelaySettingsInput) => Promise<void>;
}

const defaultValue: ISettingsContext = {
  saveSettings: async () => undefined,
  RPCs: defaultRPCs,
};

const logger = getLogger(LOGGER_NAME_RELAY);

export const defaultSettings = defaultValue;

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const [settings, setSettings] = useWrappedState<RelaySettingsInput>('relay-settings', defaultValue);

  useEffect(() => {
    const storedSettings = window.localStorage.getItem('settings');

    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const saveSettings = async (data: RelaySettingsInput) => {
    try {
      logger.info('Storing new settings', data);
      window.localStorage.setItem('settings', JSON.stringify(data));
      setSettings(data);
    } catch (error) {
      logger.error('Failed to save settings', error);
      throw error;
    }
  };

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value: ISettingsContext = {
    ...settings,
    saveSettings,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useSettings = () => useContext(Context);
