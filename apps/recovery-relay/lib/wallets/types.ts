import type { Buffer } from 'buffer';

export type UTXO = {
  txHash: string;
  index: number;
  value: number;
  confirmed: boolean;
};

export type TxInput =
  | ({
      hash: string;
      index: number;
    } & {
      witnessUtxo: {
        script: Buffer;
        value: number;
      };
    })
  | {
      nonWitnessUtxo: Buffer;
    };

// TODO: WIP
export type AccountData = {
  balance: number;
  inputs?: TxInput[];
  utxos?: UTXO[];
  feeRate?: number;
  nonce?: number;
  gasPrice?: bigint | null;
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
  derivationPath: [44, number, number, number, number];
  tx: string;
};

export type RawSignature = {
  r: string;
  s: string;
  v: number;
};
