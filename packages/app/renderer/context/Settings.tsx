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
  RelayUrlParameters,
} from "../lib/relayUrl";

type Settings = z.infer<typeof settingsInput>;

interface ISettingsContext extends Settings {
  saveSettings: (settings: Settings) => Promise<void>;
  getRelayUrl: (params: RelayUrlParameters) => string;
}

const defaultValue: ISettingsContext = {
  relayBaseUrl: "",
  relayPassphrase: "",
  saveSettings: async () => undefined,
  getRelayUrl: (params: RelayUrlParameters) => _getRelayUrl(params, "", ""),
};

export const defaultSettings = defaultValue;

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const [settings, setSettings] = useState(defaultValue);

  useEffect(() => {
    ipcRenderer
      .invoke("settings/restore")
      .then((data: Settings) => setSettings((prev) => ({ ...prev, ...data })));
  }, []);

  const saveSettings = async (data: Settings) => {
    await ipcRenderer.invoke("settings/save", data);

    setSettings((prev) => ({ ...prev, ...data }));
  };

  const getRelayUrl = (params: RelayUrlParameters) =>
    _getRelayUrl(params, settings.relayBaseUrl, settings.relayPassphrase);

  const value: ISettingsContext = {
    ...settings,
    saveSettings,
    getRelayUrl,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useSettings = () => useContext(Context);
