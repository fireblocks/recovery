import Store from 'electron-store';

export type Settings = {
  idleMinutes: number;
  relayBaseUrl: string;
};

export class SettingsStore {
  private static _keys = ['relayBaseUrl'] as const;

  private static _store = new Store<Settings>({
    name: 'settings',
    /** only for obfuscation */
    encryptionKey: 'VmYq3t6v9y$B&E)H@McQfTjWnZr4u7x!',
    defaults: {
      idleMinutes: 10,
      relayBaseUrl: 'https://relay.fireblocks.solutions',
    },
  });

  public static get(): Settings {
    const settings = SettingsStore._keys.reduce((acc, key) => ({ ...acc, [key]: SettingsStore._store.get(key) }), {} as Settings);

    return settings;
  }

  public static set(data: Settings) {
    SettingsStore._keys.forEach((key) => SettingsStore._store.set(key, data[key]));
  }

  public static reset() {
    SettingsStore._store.clear();
  }
}
