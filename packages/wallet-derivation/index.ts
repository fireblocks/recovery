import { Input } from "./types";
import { BaseWallet } from "./wallets/BaseWallet";
import { getWallet } from "./wallets/chains";

export const deriveWallet = (input: Input): BaseWallet => {
  const WalletInstance = getWallet(input.assetId);

  const wallet = new WalletInstance(input);

  return wallet;
};

export * from "./types";

export * from "./wallets/chains";

export { BaseWallet };
