export const sanatize = (value: any, depth = 0): any => {
  if (!value) {
    return value;
  }
  const sanatized: { [key: string]: any } = {};
  if (depth === 10) {
    return '[Max depth reached]';
  }
  Object.keys(value).forEach((key: any) => {
    if (
      [
        'xprv',
        'fprv',
        'relayLogger',
        'utilityLogger',
        'sharedLogger',
        'wif',
        'privatekey',
        'extendedKeys',
        'accounts',
        'privateKeyWif',
        'privateKey',
        'Private Key (WIF)',
        'Private Key',
        // Non confidential information that causes issues or floods logs
        'polkadotApi',
        'kusamaApi',
        'solConnection',
      ].includes(key)
    ) {
      return;
    }
    const typeOf = typeof value[key];
    sanatized[key] =
      typeOf === 'object'
        ? sanatize(value[key], depth + 1)
        : typeOf === 'function'
        ? '[Function]'
        : typeOf === 'bigint'
        ? value[key].toString(16)
        : value[key];
  });
  return sanatized;
};
