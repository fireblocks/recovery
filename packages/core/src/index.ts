import { Input, Wallet } from "./types";
import { getWallet } from "./wallets/chains";

export const deriveWallet = (input: Input): Wallet => {
  const Wallet = getWallet(input.assetId);

  const { data } = new Wallet(input);

  return data;
};

export * from "./wallets/chains";

export type { Input, Wallet };
