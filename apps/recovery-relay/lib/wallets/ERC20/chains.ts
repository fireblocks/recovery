export function getChainId(nativeAsset: string): number | undefined {
  switch (nativeAsset) {
    case 'ETH':
      return 1;
    case 'BNB_BSC':
      return 56;
    case 'CHZ_$CHZ':
      return 88888;
    case 'CELO':
      return 42220;
    case 'RBTC':
      return 30;
    case 'AVAX':
      return 43114;
    case 'MATIC_POLYGON':
      return 137;
    case 'RON':
      return 2020;
    case 'ETH_TEST5':
      return 11155111;
    case 'ETH_TEST6':
      return 17000;
    case 'SMARTBCH':
      return 10000;
    case 'ETH-AETH':
      return 42161;
    case 'BNB_TEST':
      return 97;
    case 'FTM_FANTOM':
      return 250;
    default:
      return undefined;
  }
}
