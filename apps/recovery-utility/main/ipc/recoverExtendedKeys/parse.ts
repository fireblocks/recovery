type ExtendedPublicKeys = { xpub: string; fpub: string };

type ExtendedPrivateKeys = { xprv: string; fprv: string };

type FullExtendedKeys = ExtendedPublicKeys & ExtendedPrivateKeys;

type ExtendedKeys<P extends boolean> = P extends true ? FullExtendedKeys : ExtendedPublicKeys;

const checkKey = (prefix: 'xpub' | 'fpub' | 'xprv' | 'fprv', key?: string) => {
  const regExp = new RegExp(`^${prefix}[a-zA-Z0-9]{107}$`);

  return key && regExp.test(key);
};

export const parseExtendedKeys = <P extends boolean>(stdout: string, dangerouslyRecoverPrivateKeys?: P) => {
  let extendedKeys: ExtendedKeys<P>;

  try {
    extendedKeys = JSON.parse(stdout);
  } catch {
    throw new Error('Failed to parse extended keys');
  }

  const { xpub, fpub, xprv, fprv } = extendedKeys as FullExtendedKeys;

  if (!checkKey('xpub', xpub) || !checkKey('fpub', fpub)) {
    throw new Error('Missing extended public keys');
  }

  if (dangerouslyRecoverPrivateKeys && (!checkKey('xprv', xprv) || !checkKey('fprv', fprv))) {
    throw new Error('Missing extended private keys');
  }

  return extendedKeys;
};
