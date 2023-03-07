import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { z } from "zod";
import { settingsInput } from "../lib/schemas";
import { restoreSettings, saveSettings } from "../lib/ipc";

type Settings = z.infer<typeof settingsInput>;

interface ISettingsContext extends Settings {
  saveSettings: (settings: Settings) => Promise<void>;
}

const defaultValue: ISettingsContext = {
  relayBaseUrl: "",
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
    restoreSettings().then((settings) =>
      setSettings((prev) => ({ ...prev, ...settings }))
    );
  }, []);

  const _saveSettings = async (settings: Settings) => {
    await saveSettings(settings);

    setSettings((prev) => ({ ...prev, ...settings }));
  };

  const value: ISettingsContext = {
    ...settings,
    saveSettings: _saveSettings,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useSettings = () => useContext(Context);
