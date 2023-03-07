import { Bitcoin } from "./BTC";
import { Ethereum } from "./ETH";
import { Solana } from "./SOL";

export { BaseWallet } from "./BaseWallet";

export const WalletClasses = {
  BTC: Bitcoin,
  ETH: Ethereum,
  SOL: Solana,
};
