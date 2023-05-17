import type { Buffer } from 'buffer';

// TEMP
export type TxInput = {
  hash: string;
  index: number;
  value?: number;
  confirmed: boolean;
} & (
  | {
      /* SegWit */
      witnessUtxo?: {
        script: Buffer;
        value: number;
      };
    }
  | {
      /* Legacy */
      nonWitnessUtxo?: Buffer;
    }
);

export type AccountData = {
  balance: number;
  utxos?: TxInput[];
  feeRate?: number;
  nonce?: number;
  gasPrice?: bigint | null;
  extraParams?: Map<string, any>;
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
