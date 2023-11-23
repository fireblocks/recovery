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
        'polkadotApi', // Polkadot's index.ts contains the API field which is too large and part of printing it causes issues
        'kusamaApi', // Kusama's index.ts contains the API field which is too large and part of printing it causes issues
      ].includes(key)
    ) {
      return;
    }
    const typeOf = typeof value[key];
    sanatized[key] = typeOf === 'object' ? sanatize(value[key], depth + 1) : typeOf === 'function' ? '[Function]' : value[key];
  });
  return sanatized;
};
