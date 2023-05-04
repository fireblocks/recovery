export type UTXO = {
  txHash: string;
  index: number;
  value: number;
  confirmed: boolean;
};

export type AccountData = {
  balance: number;
  utxos?: UTXO[];
};

export type TxBroadcastVariables = {
  tx: string;
  signature: RawSignature;
};

export type TxParamsRequest = {
  assetId: string;
  hdPath: string[];
  xpub: string;
  chainId?: number;
};

export type TxParamsResponse = {
  fromAddress: string;
  balance: string;
  fee: string;
  nonce?: string;
  utxos?: {
    rawTx: string;
    txid: string;
    vout: number;
  }[];
  blockhash?: string;
};

export type TxPayload = {
  tx: string;
  signature?: RawSignature;
};

type Inputs =
  | { hash: string; index: number; witnessUtxo: { script: string; value: number } }[]
  | { hash: string; index: number; nonWitnessUtxo: string }[];

export type RawSignature = {
  r: string;
  s: string;
  v: number;
};

export type GenerateTxInput = {
  to: string;
  amount: string;
  inputs?: Inputs;
  feeRate?: number;
  nonce?: number;
  gasPrice?: string;
  blockHash?: string;
};
