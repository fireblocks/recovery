import Store from 'electron-store';

export const PROTOCOLS = {
  UTILITY: {
    directory: 'app',
    scheme: 'app',
    port: 8888,
  },
  RELAY: {
    directory: 'relay',
    scheme: 'relay',
    port: 3000,
  },
} as const;

export type Deployment = {
  protocol: keyof typeof PROTOCOLS | null;
  exp: number;
};

export class DeploymentStore {
  private static _keys = ['protocol', 'exp'] as const;

  private static _store = new Store<Deployment>({
    name: 'deployment',
  });

  public static get() {
    const deployment = DeploymentStore._keys.reduce(
      (acc, key) => ({ ...acc, [key]: DeploymentStore._store.get(key) }),
      {} as Deployment,
    );

    return deployment;
  }

  public static set(protocol: 'UTILITY' | 'RELAY' | null) {
    DeploymentStore._store.set('protocol', protocol);
    DeploymentStore._store.set('exp', Date.now() + 5000); // 5 seconds
  }

  public static reset() {
    DeploymentStore._store.clear();
  }
}
