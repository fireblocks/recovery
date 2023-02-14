type UTXO = {
  txHash: string;
  index: number;
  value: number;
  confirmed: boolean;
};

type AccountData = {
  balance: number;
  utxos?: UTXO[];
};

type TxParamsRequest = {
  assetId: string;
  hdPath: string[];
  xpub: string;
  chainId?: number;
};

type TxParamsResponse = {
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

type TxPayload = {
  derivationPath: [number, number, number, number, number];
  tx: string;
};

type RawSignature = {
  r: string;
  s: string;
  v: number;
};
