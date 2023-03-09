import { Bitcoin } from "./BTC";
import { Ethereum } from "./ETH";
import { Solana } from "./SOL";

export { BaseWallet } from "./BaseWallet";

export const WalletClasses = {
  BTC: Bitcoin,
  BTC_TEST: Bitcoin,
  ETH: Ethereum,
  ETH_TEST3: Ethereum,
  ETH_TEST5: Ethereum,
  SOL: Solana,
  SOL_TEST: Solana,
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;
