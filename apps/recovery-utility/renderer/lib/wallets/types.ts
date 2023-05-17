export type UTXO = {
  txHash: string;
  index: number;
  value: number;
  confirmed: boolean;
};

export type AccountData = {
  balance: number;
  inputs?: UTXO[];
};

export type TxPayload = {
  tx: string;
  signature?: RawSignature;
};

type Inputs =
  | { confirmed: boolean; hash: string; index: number; witnessUtxo: { script: any; value: number } }[]
  | { confirmed: boolean; hash: string; index: number; nonWitnessUtxo: any }[];

export type RawSignature = {
  r: string;
  s: string;
  v: number;
};

export type GenerateTxInput = {
  to: string;
  amount: number;
  utxos?: Inputs;
  feeRate?: number;
  nonce?: number;
  gasPrice?: string;
  blockHash?: string;
  memo?: string;
  extraParams?: Map<string, any>;
};
