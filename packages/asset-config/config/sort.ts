export const ASSETS_IDS_ORDER = [
  'BTC',
  'BTC_TEST',
  'USDT_ERC20',
  'ETH',
  'ETH_TEST',
  'USDC',
  'USDC_T',
  'XRP',
  'XRP_TEST',
  'HUSD',
  'LTC',
  'LTC_TEST',
  'EOS',
  'EOS_TEST',
  'BCH',
  'BCH_TEST',
  'BUSD',
  'PAX',
  'USDT_OMNI',
  'XTP',
  'ETC',
  'ETC_TEST',
  'XAUT',
  'XLM',
  'XLM_TEST',
  'SIGNET_USD',
  'DAI',
  'DAI_T',
  'TUSD',
  'BSV',
  'BSV_TEST',
  'CEL',
  'SEN_USD',
  'DASH',
  'DASH_TEST',
  'CUSDC',
  'FTT',
  'CDAI',
  'GUSD',
  'LINK',
  'OMG',
  'ZRX',
  'PAXG',
  'MKR',
  'LEND',
];

export const ASSETS_SYMBOLS_ORDER = [
  'USD',
  'BTC',
  'BTC_TEST',
  'USDT',
  'ETH',
  'ETH_TEST',
  'USDC',
  'CUSDC_T',
  'XRP',
  'XRP_TEST',
  'HUSD',
  'LTC',
  'LTC_TEST',
  'EOS',
  'EOS_TEST',
  'BCH',
  'BCH_TEST',
  'BUSD',
  'PAX',
  'XTP',
  'ETC',
  'ETC_TEST',
  'XAUT',
  'XLM',
  'XLM_TEST',
  'DAI',
  'DAI_T',
  'TUSD',
  'BSV',
  'BSV_TEST',
  'CEL',
  'DASH',
  'DASH_TEST',
  'FTT',
  'GUSD',
  'LINK',
  'OMG',
  'ZRX',
  'PAXG',
  'MKR',
  'LEND',
];

// function fixedOrderSort<T>(assets: T[], field: string, order: string[]): T[] {
//   type TGroupsType = { preOrderedGroup: T[]; rest: T[] };
//   const groups = assets.reduce<TGroupsType>(
//     (prev, cur) => {
//       if (order.indexOf(cur[field]) > -1) {
//         prev.preOrderedGroup.push(cur);
//       } else {
//         prev.rest.push(cur);
//       }
//       return prev;
//     },
//     { preOrderedGroup: [], rest: [] },
//   );

//   const sortedPreOrderedGroup = groups.preOrderedGroup.sort((a, b) => {
//     const aIdx = order.indexOf(a[field]);
//     const bIdx = order.indexOf(b[field]);
//     return aIdx - bIdx;
//   });
//   const sortedRestGroup = groups.rest.sort((a, b) => (a[field] > b[field] ? 1 : -1));
//   return [...sortedPreOrderedGroup, ...sortedRestGroup];
// }

// export function sortBySymbol<T extends { symbol: string }>(assets: T[]): T[] {
//   return fixedOrderSort(assets, 'symbol', ASSETS_SYMBOLS_ORDER);
// }

// export function sortByAssetId<T extends { id: string }>(assets: T[]): T[] {
//   return fixedOrderSort(assets, 'id', ASSETS_IDS_ORDER);
// }
