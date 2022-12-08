import { safeStorage } from "electron";
import Store from "electron-store";

export type Settings = {
  relayBaseUrl: string;
  relayPassphrase: string;
};

export class SettingsStore {
  private static _isEncryptionAvailable = safeStorage.isEncryptionAvailable();
  private static _keys = ["relayBaseUrl", "relayPassphrase"] as const;
  private static _secureKeys = ["relayPassphrase"] satisfies Array<
    keyof Settings
  >;

  private static _store = new Store<Settings>({
    name: "settings",
    /** only for obfuscation */
    encryptionKey: "VmYq3t6v9y$B&E)H@McQfTjWnZr4u7x!",
    defaults: {
      relayBaseUrl: "https://fbrelay.app",
      relayPassphrase: "",
    },
  });

  private static _setEncryptedValue(key: keyof Settings, value: string) {
    SettingsStore._store.set(key, safeStorage.encryptString(value));
  }

  private static _getEncryptedValue(key: keyof Settings) {
    const encryptedValue = SettingsStore._store.get(key);

    return encryptedValue
      ? safeStorage.decryptString(Buffer.from(encryptedValue, "utf8"))
      : undefined;
  }

  public static get(): Settings {
    const settings = SettingsStore._keys.reduce((acc, key) => {
      if (
        SettingsStore._isEncryptionAvailable &&
        SettingsStore._secureKeys.includes(key as any)
      ) {
        return { ...acc, [key]: SettingsStore._getEncryptedValue(key) };
      }

      return { ...acc, [key]: SettingsStore._store.get(key) };
    }, {} as Settings);

    return settings;
  }

  public static set(data: Settings) {
    SettingsStore._keys.forEach((key) => {
      if (
        SettingsStore._isEncryptionAvailable &&
        SettingsStore._secureKeys.includes(key as any)
      ) {
        SettingsStore._setEncryptedValue(key, data[key]);
      } else {
        SettingsStore._store.set(key, data[key]);
      }
    });
  }

  public static reset() {
    SettingsStore._store.clear();
  }
}
