export type Algorithm = "ECDSA" | "EDDSA";

export type HDPath = Readonly<{
  coinType: number;
  account: number;
  changeIndex: number;
  addressIndex: number;
}>;

export type HDPathParts = [44, number, number, number, number];

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

export type Derivation = Readonly<{
  publicKey: string;
  privateKey?: string;
  wif?: string;
  evmAddress?: string;
}>;
