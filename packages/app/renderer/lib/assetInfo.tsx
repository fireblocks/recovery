import { BitcoinIcon, EthereumIcon, SolanaIcon } from "../components/Icons";

const getBaseAssetName = (assetId?: string) => {
  switch (assetId) {
    case "BTC":
    case "BTC_TEST":
      return "Bitcoin";
    case "ETH":
    case "ETH_TEST":
      return "Ethereum";
    case "SOL":
    case "SOL_TEST":
      return "Solana";
    default:
      return assetId;
  }
};

const getAssetSuffix = (assetId?: string) =>
  assetId?.endsWith("_TEST") ? " (Test)" : "";

export const getAssetName = (assetId?: string) =>
  `${getBaseAssetName(assetId)}${getAssetSuffix(assetId)}`;

export const getAssetIcon = (assetId?: string) => {
  switch (assetId) {
    case "BTC":
    case "BTC_TEST":
      return <BitcoinIcon />;
    case "ETH":
    case "ETH_TEST":
      return <EthereumIcon />;
    case "SOL":
    case "SOL_TEST":
      return <SolanaIcon />;
    default:
      return null;
  }
};
