import { AssetConfig } from '../types';

const ASSETS_IDS_ORDER = [
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

export const orderId = (a: string, b: string) => {
  const aIndex = ASSETS_IDS_ORDER.indexOf(a);
  const bIndex = ASSETS_IDS_ORDER.indexOf(b);

  if (aIndex === -1 && bIndex === -1) {
    return a.localeCompare(b);
  }

  if (aIndex === -1) {
    return 1;
  }

  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
};

export const orderAssetById = (a: AssetConfig, b: AssetConfig) => orderId(a.id, b.id);
