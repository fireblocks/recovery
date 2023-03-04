export type Algorithm = "ECDSA" | "EDDSA";

type HDPath = Readonly<{
  coinType: number;
  account: number;
  changeIndex: number;
  addressIndex: number;
}>;

type HDPathInput = Partial<HDPath>;

export type Input = Readonly<{
  xprv?: string;
  fprv?: string;
  xpub?: string;
  fpub?: string;
  assetId: string;
  path: HDPathInput;
  isTestnet?: boolean;
  isLegacy?: boolean;
}>;

export type DerivationInput = Readonly<{
  extendedKey: string;
  pathParts: readonly [number, number, number, number, number];
}>;

export type AddressInput = Readonly<{
  publicKey: string;
  evmAddress?: string;
}>;

export type Derivation = {
  publicKey: string;
  privateKey?: string;
  wif?: string;
  evmAddress?: string;
};

export type Wallet = Pick<Input, "assetId" | "isTestnet" | "isLegacy"> & {
  path: HDPath;
  address: string;
  publicKey: string;
  privateKey?: string;
  wif?: string;
};
