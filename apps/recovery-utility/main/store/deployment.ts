import Store from 'electron-store';

export type Deployment = {
  app: 'utility' | 'relay';
};

export class DeploymentStore {
  private static _keys = ['app'] as const;

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

  public static set(data: Deployment) {
    DeploymentStore._keys.forEach((key) => DeploymentStore._store.set(key, data[key]));
  }

  public static reset() {
    DeploymentStore._store.clear();
  }
}
