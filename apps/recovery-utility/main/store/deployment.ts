import Store from 'electron-store';
import os from 'os';

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
    // Due to comment under useDeployment.ts for linux, we give linux 1 minute for the mode timeout instead of 15 seconds.
    const expTimeout = os.platform() === 'linux' ? 60_000 : 15_000;
    DeploymentStore._store.set('protocol', protocol);
    DeploymentStore._store.set('exp', Date.now() + expTimeout); // 15 seconds
  }

  public static reset() {
    DeploymentStore._store.clear();
  }
}
