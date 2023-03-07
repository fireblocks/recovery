import { Input, Wallet } from "./types";
import { getWallet } from "./wallets/chains";

export const deriveWallet = (input: Input): Wallet => {
  const WalletInstance = getWallet(input.assetId);

  const { data } = new WalletInstance(input);

  return data;
};

export * from "./wallets/chains";

export type { Input, Wallet };
