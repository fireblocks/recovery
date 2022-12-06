import { ComponentType } from "react";
import { BitcoinIcon, EthereumIcon, SolanaIcon } from "../components/Icons";

export type SupportedAssetId = "BTC" | "ETH" | "SOL";

export type AssetInfo = {
  id: SupportedAssetId;
  name: string;
  Icon: ComponentType;
  derivation: {
    utxo: boolean;
    legacy: boolean;
    checksum: boolean;
  };
};

export type AssetsInfo = Record<SupportedAssetId, AssetInfo>;

export const assetsInfo: AssetsInfo = {
  BTC: {
    id: "BTC",
    name: "Bitcoin",
    Icon: BitcoinIcon,
    derivation: {
      utxo: true,
      legacy: true,
      checksum: false,
    },
  },
  ETH: {
    id: "ETH",
    name: "Ethereum",
    Icon: EthereumIcon,
    derivation: {
      utxo: false,
      legacy: false,
      checksum: true,
    },
  },
  SOL: {
    id: "SOL",
    name: "Solana",
    Icon: SolanaIcon,
    derivation: {
      utxo: false,
      legacy: false,
      checksum: false,
    },
  },
};

export const getAssetInfo = (assetId?: string) => {
  if (!assetId) {
    return;
  }

  const normalizedAssetId = assetId.split("_TEST")[0] as SupportedAssetId;

  return assetsInfo[normalizedAssetId];
};

const assetIds = Object.keys(assetsInfo) as SupportedAssetId[];

export const assets = assetIds.map((id) => assetsInfo[id]);
