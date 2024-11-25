import type { NativeAssetPatch, NativeAssetPatches, GetExplorerUrl } from '../types';

// Native asset explorer handlers

type ExplorerUrlBuilder = (baseUrl: string) => GetExplorerUrl;

const getStandardExplorer = (baseUrl: string) => (type: string) => (value: string) =>
  baseUrl.startsWith('https://') ? `${baseUrl}/${type}/${value}` : `https://${baseUrl}/${type}/${value}`;

const getAdaExplorer: ExplorerUrlBuilder = (baseUrl) => (type) => {
  const segment = type === 'tx' ? 'transaction' : type;

  return getStandardExplorer(baseUrl)(segment);
};

const getAtomExplorer: ExplorerUrlBuilder = (baseUrl) => (type) => {
  const segment = type === 'tx' ? 'transactions' : 'accounts';

  return getStandardExplorer(baseUrl)(segment);
};

const getSolanaExplorer: ExplorerUrlBuilder = (cluster?: string) => (type) => (value) => {
  const baseUrl = getStandardExplorer('explorer.solana.com')(type)(value);

  return `${baseUrl}?cluster=${cluster}`;
};

const evm = (baseExplorerUrl: string, rpcUrl?: string, transfer = true): NativeAssetPatch => ({
  derive: true,
  transfer,
  rpcUrl,
  getExplorerUrl: getStandardExplorer(baseExplorerUrl),
});

const btc = (baseExplorerUrl: string, segwit: boolean, derive = true, transfer = true): NativeAssetPatch => ({
  derive,
  transfer,
  utxo: true,
  segwit,
  getExplorerUrl: getStandardExplorer(baseExplorerUrl),
});

/**
 * Patches for supported native assets.
 */
export const nativeAssetPatches: NativeAssetPatches = {
  ADA: {
    derive: true,
    transfer: true,
    utxo: true,
    rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    getExplorerUrl: getAdaExplorer('cardanoscan.io'),
  },
  ADA_TEST: {
    derive: true,
    transfer: true,
    utxo: true,
    rpcUrl: 'https://cardano-preprod.blockfrost.io/api/v0',
    getExplorerUrl: getAdaExplorer('preprod.cardanoscan.io'),
  },
  ALGO: {
    getExplorerUrl: getStandardExplorer('algoexplorer.io'),
    derive: true,
    transfer: false,
  },
  ALGO_TEST: {
    getExplorerUrl: getStandardExplorer('testnet.algoexplorer.io'),
    derive: true,
    transfer: false,
  },
  AOA: evm('browser.aurorachain.io', 'https://mainnet.aurora.dev'),
  ATOM_COS: {
    derive: true,
    transfer: true,
    rpcUrl: 'cosmos-rpc.quickapi.com',
    getExplorerUrl: getAtomExplorer('bigdipper.live/cosmos'),
  },
  ATOM_COS_TEST: {
    derive: true,
    transfer: true,
    rpcUrl: 'cosmos-lcd.quickapi.com',
    getExplorerUrl: getAtomExplorer('explorer.theta-testnet.polypore.xyz'),
  },
  AURORA_DEV: {
    derive: true,
    transfer: true,
    rpcUrl: 'https://mainnet.aurora.dev',
  },
  AVAX: evm('cchain.explorer.avax.network', 'https://api.avax.network/ext/bc/C/rpc'),
  AVAXTEST: evm('subnets-test.avax.network/c-chain', 'https://api.avax-test.network/ext/bc/C/rpc'),
  BCH: btc('blockexplorer.one/bitcoin-cash/mainnet', false),
  BCH_TEST: btc('blockexplorer.one/bitcoin-cash/testnet', false, true, false),
  BNB_BSC: evm('bscscan.com'),
  BNB_TEST: evm('test.bscscan.com'),
  BSV: btc('whatsonchain.com', false),
  BSV_TEST: btc('test.whatsonchain.com', false),
  BTC: btc('blockstream.info', true),
  BTC_TEST: btc('blockstream.info/testnet', true),
  CELO: evm('explorer.celo.org'),
  CELO_ALF: evm('alfajores-blockscout.celo-testnet.org'),
  CELO_BAK: evm('baklava-blockscout.celo-testnet.org'),
  CHZ_$CHZ: evm('explorer.chiliz.com'),
  CORE_COREDAO: evm('https://scan.coredao.org'),
  CORE_COREDAO_TEST: evm('https://scan.test.btcs.network'),
  DASH: btc('blockexplorer.one/dash/mainnet', false),
  DASH_TEST: btc('blockexplorer.one/dash/testnet', false, true, false),
  DOGE: btc('blockexplorer.one/dogecoin/mainnet', false),
  DOGE_TEST: btc('blockexplorer.one/dogecoin/testnet', false, true, false),
  DOT: {
    derive: true,
    transfer: true,
    rpcUrl: 'https://rpc.polkadot.io',
    getExplorerUrl: (type: string) => (value: string) =>
      `https://explorer.polkascan.io/polkadot/${type === 'tx' ? 'extrinsic' : 'account'}/${value}`,
  },
  EOS: {
    derive: true,
    transfer: false,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: true,
    getExplorerUrl: getStandardExplorer('bloks.io'),
  },
  EOS_TEST: {
    derive: true,
    transfer: false,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: true,
    getExplorerUrl: getStandardExplorer('jungle3.bloks.io'),
  },
  ETC: evm('blockscout.com/etc/mainnet', 'https://geth-de.etc-network.info'),
  ETC_TEST: evm('blockscout.com/etc/kotti', 'https://geth-mordor.etc-network.info'),
  ETH: evm('etherscan.io', 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'),
  ETH_TEST3: evm('goerli.etherscan.io', 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'),
  ETH_TEST5: evm('sepolia.etherscan.io', 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'),
  ETH_TEST6: evm('holesky.etherscan.io', 'https://ethereum-holesky-rpc.publicnode.com'),
  'ETH-AETH': evm('arbiscan.io'),
  'ETH-AETH_RIN': evm('testnet.arbiscan.io'),
  'ETH-OPT': evm('optimistic.etherscan.io'),
  'ETH-OPT_KOV': evm('kovan-optimistic.etherscan.io'),
  ETHW: evm('www.oklink.com/ethw'),
  EVMOS: evm('bigdipper.live/evmos', 'https://rpc.evmos.org'),
  FTM_FANTOM: evm('ftmscan.com', 'https://rpcapi.fantom.network'),
  GLMR_GLMR: evm('moonscan.io', 'https://rpc.moonriver.moonbeam.network'),
  HBAR: {
    derive: true,
    memo: true,
    getExplorerUrl: getStandardExplorer('explorer.arkhia.io/#/mainnet'),
  },
  HBAR_TEST: {
    derive: true,
    memo: true,
    getExplorerUrl: getStandardExplorer('explorer.arkhia.io/#/testnet'),
  },
  KSM: evm('polkascan.io/kusama', 'https://kusama-rpc.polkadot.io'),
  LTC: btc('blockexplorer.one/litecoin/mainnet', false),
  LTC_TEST: btc('blockexplorer.one/litecoin/testnet', false, true, false),
  LUNA: {
    getExplorerUrl: getStandardExplorer('finder.terra.money/classic'),
  },
  LUNA2: {
    derive: true,
    transfer: true,
    getExplorerUrl: getStandardExplorer('finder.terra.money'),
  },
  LUNA2_TEST: {
    derive: true,
    transfer: true,
    getExplorerUrl: getStandardExplorer('finder.terra.money/testnet'),
  },
  MATIC_POLYGON: evm('polygonscan.com', 'https://polygon-rpc.com/'),
  MATIC_POLYGON_MUMBAI: evm('mumbai.polygonscan.com', 'https://polygon-mumbai.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78'),
  AMOY_POLYGON_TEST: evm('amoy.polygonscan.com', 'https://polygon-amoy-bor-rpc.publicnode.com'),
  MOVR_MOVR: evm('moonriver.moonscan.io'),
  NEAR: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getAtomExplorer('explorer.near.org'),
  },
  NEAR_TEST: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getAtomExplorer('explorer.testnet.near.org'),
  },
  RBTC: evm('explorer.rsk.co'),
  RBTC_TEST: evm('explorer.testnet.rsk.co'),
  RON: evm('explorer.roninchain.com'),
  SGB: evm('songbird-explorer.flare.network', 'https://sgb.ftso.com.au/ext/bc/C/rpc'),
  SGB_LEGACY: evm('songbird-explorer.flare.network', 'https://sgb.ftso.com.au/ext/bc/C/rpc'),
  SMARTBCH: evm('sonar.cash', 'https://smartbch-wss.greyh.at'),
  SOL: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getSolanaExplorer('mainnet'),
  },
  SOL_TEST: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getSolanaExplorer('devnet'),
  },
  CELESTIA: {
    derive: true,
    transfer: true,
    rpcUrl: 'https://api.celestia.pops.one',
    getExplorerUrl: (type: string) => (value: string) =>
      `https://celestia.explorers.guru/${type === 'tx' ? 'transaction' : 'account'}/${value}`,
  },
  CELESTIA_TEST: {
    derive: true,
    transfer: true,
    rpcUrl: 'https://rpc.celestia-mocha.com',
    getExplorerUrl: (type: string) => (value: string) =>
      `https://testnet.celestia.explorers.guru/${type === 'tx' ? 'transaction' : 'account'}/${value}`,
  },
  // TERRA_KRW: evm('finder.terra.money/columbus-4', 'https://lcd.terra.dev'),
  // TERRA_KRW_TEST: evm('finder.terra.money/tequila-0004', 'https://tequila-lcd.terra.dev'),
  // TERRA_MNT: evm('finder.terra.money/moonshine', 'https://moonshine-lcd.terra.dev'),
  // TERRA_MNT_TEST: evm('finder.terra.money/moonshine-testnet', 'https://moonshine-testnet-lcd.terra.dev'),
  // TERRA_SDR: evm('finder.terra.money/sputnik', 'https://sputnik-lcd.terra.dev'),
  // TERRA_SDR_TEST: evm('finder.terra.money/sputnik-testnet', 'https://sputnik-testnet-lcd.terra.dev'),
  // TERRA_USD: evm('finder.terra.money/columbus-5', 'https://lcd.terra.dev'),
  TKX: evm('scan.tokenx.finance'),
  TRX: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getStandardExplorer('tronscan.org'),
  },
  TRX_TEST: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getStandardExplorer('shasta.tronscan.org'),
  },
  VLX_TEST: evm('testnet.velas.com', 'https://api.testnet.velas.com'),
  VLX_VLX: evm('native.velas.com', 'https://api.velas.com'),
  WND: evm('westend.subscan.io', 'https://rpc.westend.subscan.io'),
  XDB: evm('xdbexplorer.com', 'https://rpc.xdbchain.com', false),
  XDB_TEST: evm('xdbexplorer.com', 'https://rpc.xdbchain.com', false),
  XDC: evm('observer.xdc.org', 'https://rpc.xinfin.network'),
  XEC: btc('explorer.bitcoinabc.org', false, true, false),
  XEC_TEST: btc('texplorer.bitcoinabc.org', false, true, false),
  XEM: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: true,
    getExplorerUrl: (type) => (value) => {
      if (type === 'address') {
        return `https://explorer.nemtool.com/#/s_account?account=${value}`;
      }

      return `https://explorer.nemtool.com/#/s_tx?hash=${value}`;
    },
    rpcUrl: 'http://hugealice3.nem.ninja:7778',
  },
  XEM_TEST: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: true,
    getExplorerUrl: (type) => (value) => {
      if (type === 'address') {
        return `https://testnet-explorer.nemtool.com/#/s_account?account=${value}`;
      }

      return `https://testnet-explorer.nemtool.com/#/s_tx?hash=${value}`;
    },
    rpcUrl: 'http://hugetestalice.nem.ninja:7890',
  },
  XLM: evm('stellarchain.io', 'https://horizon.stellar.org'),
  XLM_TEST: evm('testnet.stellarchain.io', 'https://horizon-testnet.stellar.org'),
  XRP: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: true,
    getExplorerUrl: getStandardExplorer('livenet.xrpl.org'),
  },
  XRP_TEST: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: false,
    memo: true,
    getExplorerUrl: getStandardExplorer('testnet.xrpl.org'),
  },
  XTZ: evm('tzkt.io', 'https://mainnet-tezos.giganode.io'),
  XTZ_TEST: evm('ghostnet.tzkt.io', 'https://testnet-tezos.giganode.io'),
  ZEC: {
    derive: true,
    transfer: false,
    utxo: true,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getStandardExplorer('explorer.zcha.in'),
  },
  ZEC_TEST: {
    derive: true,
    transfer: false,
    utxo: true,
    segwit: false,
    minBalance: false,
    memo: false,
    getExplorerUrl: getStandardExplorer('explorer.testnet.z.cash'),
  },
  TON: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: true,
    memo: true,
    getExplorerUrl: (type) => (value) => {
      if (type === 'tx') {
        return `https://tonviewer.com/transaction/${value}`;
      }

      return `https://tonviewer.com/${value}`;
    },
  },
  TON_TEST: {
    derive: true,
    transfer: true,
    utxo: false,
    segwit: false,
    minBalance: true,
    memo: true,
    getExplorerUrl: (type) => (value) => {
      if (type === 'tx') {
        return `https://testnet.tonviewer.com/transaction/${value}`;
      }

      return `https://testnet.tonviewer.com/${value}`;
    },
  },
};
