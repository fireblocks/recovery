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
  derivationPath: [number, number, number, number, number];
  tx: string;
};

export type RawSignature = {
  r: string;
  s: string;
  v: number;
};
