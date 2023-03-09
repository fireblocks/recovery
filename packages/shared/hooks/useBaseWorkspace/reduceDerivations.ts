import {
  ExtendedKeys,
  Input,
  BaseWallet,
  HDPathInput,
} from "@fireblocks/wallet-derivation";
import { getAsset, getSupportedAsset } from "../../constants/assetInfo";
import { VaultAccount, Wallet } from "../../types";

export type DerivationReducerInput<T extends BaseWallet> = {
  extendedKeys?: ExtendedKeys;
  accounts: Map<number, VaultAccount<T>>;
  assetId: string;
  accountId: number;
  accountName?: string;
  path?: HDPathInput;
  address?: string;
  type?: string;
  description?: string;
  tag?: string;
  publicKey?: string;
  privateKey?: string;
  wif?: string;
  isTestnet?: boolean;
  isLegacy?: boolean;
  balance?: { native?: number; usd?: number };
  deriveWallet: (input: Input) => T;
};

export const testIsLegacy = (assetId: string, address: string) =>
  assetId === "BTC" && !address.startsWith("bc1") && !address.startsWith("tb1");

export const sumDerivationBalances = <T extends BaseWallet = BaseWallet>(
  derivations: T[]
) =>
  derivations.reduce((acc, { balance }) => {
    const sum = { ...acc };

    const unitKeys = Object.keys(balance) as (keyof typeof balance)[];

    unitKeys.forEach((unitKey) => {
      sum[unitKey] = (sum[unitKey] ?? 0) + (balance[unitKey] ?? 0);
    });

    return sum;
  }, {} as BaseWallet["balance"]);

export const reduceDerivations = <T extends BaseWallet = BaseWallet>(
  input: DerivationReducerInput<T>
) => {
  const {
    extendedKeys,
    accounts,
    assetId,
    accountId = 0,
    accountName = `Account ${input.accountId}`,
    address,
    type,
    description,
    tag,
    publicKey,
    privateKey,
    wif,
    isLegacy = !!input.address && testIsLegacy(input.assetId, input.address),
    isTestnet = getAsset(input.assetId)?.isTestnet ??
      input.assetId.includes("TEST"),
    balance = { native: 0, usd: 0 },
    deriveWallet,
  } = input;

  const path = {
    ...input.path,
    account: input.path?.account ?? input.accountId ?? 0,
    changeIndex: input.path?.changeIndex ?? 0,
    addressIndex: input.path?.addressIndex ?? 0,
  };

  const account: VaultAccount<T> = {
    id: accountId,
    name: accountName,
    wallets: new Map<string, Wallet<T>>(),
    ...accounts.get(accountId),
  };

  const wallet: Wallet<T> = {
    assetId,
    isTestnet,
    derivations: new Map<string, T>(),
    ...account.wallets.get(assetId),
  };

  // Mock derivation
  if (address) {
    wallet.derivations.set(address, {
      assetId,
      path,
      pathParts: [
        44,
        path.coinType,
        path.account,
        path.changeIndex,
        path.addressIndex,
      ],
      address,
      tag,
      type,
      description,
      publicKey,
      privateKey,
      wif,
      isTestnet,
      isLegacy,
      balance,
    } as unknown as T);
  }

  const derivationInput: Input = {
    ...extendedKeys,
    assetId,
    path,
    isTestnet,
    isLegacy,
  };

  const { xpub, fpub, xprv, fprv } = extendedKeys ?? {};

  const hasXpub = !!xpub || !!fpub;

  const hasXprv = !!xprv || !!fprv;

  const canDerive = (hasXpub || hasXprv) && !!getSupportedAsset(assetId);

  const missingWalletKey = (hasXpub && !publicKey) || (hasXprv && !privateKey);

  const shouldDerive =
    canDerive &&
    (missingWalletKey || !address || !wallet.derivations.has(address));

  // Derive wallet
  if (shouldDerive) {
    const derivation = deriveWallet(derivationInput);

    if (address && derivation.address !== address) {
      throw new Error(
        `Address mismatch: ${address} does not match derivation address ${derivation.address}`
      );
    }

    derivation.balance = { ...derivation.balance, ...balance };

    wallet.derivations.set(derivation.address, derivation);
  }

  // Handle legacy + Segwit derivations
  if (assetId === "BTC") {
    const hasOneAddressForPath =
      Array.from(wallet.derivations.values()).filter(
        (d) => d.path.addressIndex === path.addressIndex
      ).length < 2;

    if (hasOneAddressForPath) {
      const altDerivation = deriveWallet({
        ...derivationInput,
        isLegacy: !isLegacy,
      });

      wallet.derivations.set(altDerivation.address, altDerivation);
    }
  }

  wallet.balance = sumDerivationBalances(
    Array.from(wallet.derivations.values())
  );

  account.wallets.set(assetId, wallet);

  return account;
};
