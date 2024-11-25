import { assets } from '@fireblocks/asset-config';
import { Cardano } from './ADA';
import { Algorand } from './ALGO';
import { Cosmos } from './ATOM';
import { BitcoinCash } from './BCH';
import { BitcoinSV } from './BSV';
import { Bitcoin } from './BTC';
import { DASH } from './DASH';
import { DogeCoin } from './DOGE';
import { Polkadot } from './DOT';
import { EOS } from './EOS';
import { ERC20 } from './ERC20';
import { ETC } from './ETC';
import { EVMWallet } from './EVM';
import { Kusama } from './KSM';
import { LiteCoin } from './LTC';
import { Luna } from './LUNA';
import { Near } from './NEAR';
import { NEM } from './NEM';
import { Solana } from './SOL';
import { Tron } from './Tron';
import { Stellar } from './XLM';
import { Ripple } from './XRP';
import { Tezos } from './XTZ';
import { ZCash } from './ZEC';
import { Hedera } from './HBAR';
import { Celestia } from './TIA';
import { Ton } from './TON';

export const getWallet = (assetId: string) => {
  const asset = assets[assetId];

  if (!asset) {
    throw new Error(`Unknown asset "${assetId}"`);
  }

  if (!asset.derive) {
    throw new Error(`Asset "${assetId}" is not derivable`);
  }

  if (asset.protocol === 'ETH') {
    return EVMWallet;
  }

  switch (assetId) {
    // EdDSA
    case 'ADA':
    case 'ADA_TEST':
      return Cardano;
    case 'ALGO':
      return Algorand;
    case 'SOL':
    case 'SOL_TEST':
      return Solana;
    case 'XLM':
    case 'XLM_TEST':
      return Stellar;
    case 'NEAR':
    case 'NEAR_TEST':
      return Near;
    case 'XTZ':
    case 'XTZ_TEST':
      return Tezos;
    case 'DOT':
    case 'WND':
      return Polkadot;
    case 'KSM':
      return Kusama;
    case 'XEM':
    case 'XEM_TEST':
      return NEM;
    case 'HBAR':
    case 'HBAR_TEST':
      return Hedera;
    case 'TON':
    case 'TON_TEST':
      return Ton;

    // ECDSA
    case 'ATOM_COS':
    case 'ATOM_COS_TEST':
      return Cosmos;
    case 'BTC':
    case 'BTC_TEST':
      return Bitcoin;
    case 'BSV':
    case 'BSV_TEST':
      return BitcoinSV;
    case 'BCH':
    case 'BCH_TEST':
      return BitcoinCash;
    case 'DOGE':
    case 'DOGE_TEST':
      return DogeCoin;
    case 'EOS':
    case 'EOS_TEST':
      return EOS;
    case 'LTC':
    case 'LTC_TEST':
      return LiteCoin;
    case 'ZEC':
    case 'ZEC_TEST':
      return ZCash;
    case 'LUNA2':
    case 'LUNA2_TEST':
      return Luna;
    case 'DASH':
      return DASH;
    case 'TRX':
      return Tron;
    case 'ETC':
    case 'ETC_TEST':
      return ETC;
    case 'XRP':
    case 'XRP_TEST':
      return Ripple;
    case 'TIA':
    case 'TIA_TEST':
      return Celestia;
    default:
      throw new Error(`Unsupported asset "${assetId}"`);
  }
};

export {
  BitcoinSV,
  Bitcoin,
  BitcoinCash,
  DogeCoin,
  LiteCoin,
  Ripple,
  ZCash,
  DASH,
  EOS,
  EVMWallet,
  ETC,
  Solana,
  Algorand,
  Cardano,
  ERC20,
  Cosmos,
  Tron,
  Luna,
  Stellar,
  Near,
  Tezos,
  Polkadot,
  Kusama,
  NEM,
  Hedera,
  Celestia,
  Ton,
};
