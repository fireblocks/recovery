import bip44Constants from 'bip44-constants';

// Mask
const HARDENED_OFFSET = 0x80000000;

export const symbolCoinTypeMap = bip44Constants.reduce((acc, data) => {
  const [coinTypeHex, symbol] = data;

  // eslint-disable-next-line no-bitwise
  const coinType = coinTypeHex & ~HARDENED_OFFSET;

  return {
    ...acc,
    [symbol]: coinType,
  };
}, {} as Record<string, number>);
