type HDPath = Readonly<{
  coinType: number;
  account: number;
  changeIndex: number;
  addressIndex: number;
}>;

type HDPathInput = Partial<HDPath>;

export type Input = Readonly<{
  xprv?: string;
  xpub?: string;
  fprv?: string;
  fpub?: string;
  assetId: string;
  path: HDPathInput;
  isTestnet?: boolean;
  isLegacy?: boolean;
}>;

export type DerivationInput = Readonly<{
  extendedKey: string;
  pathParts: [number, number, number, number, number];
}>;

export type AddressInput = Readonly<{
  publicKey: string;
  evmAddress?: string;
  isTestnet?: boolean;
  isLegacy?: boolean;
}>;

export type Derivation = {
  publicKey: string;
  privateKey?: string;
  wif?: string;
  evmAddress?: string;
};

export type Wallet = Omit<Input, "xprv" | "xpub" | "fprv" | "fpub"> & {
  path: HDPath;
  address: string;
  publicKey: string;
  privateKey?: string;
  wif?: string;
};
