import { ipcRenderer } from "electron";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { z } from "zod";
import { settingsInput } from "../lib/schemas";
import {
  getRelayUrl as _getRelayUrl,
  RelayUrlInputData,
} from "../lib/relayUrl";

type Settings = z.infer<typeof settingsInput>;

interface ISettingsContext extends Settings {
  saveSettings: (settings: Settings) => Promise<void>;
  getRelayUrl: (data: RelayUrlInputData, pin: string) => Promise<string>;
}

const defaultValue: ISettingsContext = {
  relayBaseUrl: "",
  saveSettings: async () => undefined,
  getRelayUrl: async (data: RelayUrlInputData, pin: string) =>
    _getRelayUrl({ baseUrl: "", pin, data }),
};

export const defaultSettings = defaultValue;

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const [settings, setSettings] = useState<Settings>(defaultValue);

  useEffect(() => {
    ipcRenderer
      .invoke("settings/restore")
      .then((data: Settings) => setSettings((prev) => ({ ...prev, ...data })));
  }, []);

  const saveSettings = async (data: Settings) => {
    await ipcRenderer.invoke("settings/save", data);

    setSettings((prev) => ({ ...prev, ...data }));
  };

  const getRelayUrl = async (data: RelayUrlInputData, pin: string) =>
    _getRelayUrl({ baseUrl: settings.relayBaseUrl, pin, data });

  const value: ISettingsContext = {
    ...settings,
    saveSettings,
    getRelayUrl,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useSettings = () => useContext(Context);
