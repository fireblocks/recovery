export type AccountData = {
  balance: number;
  inputs?: UTXO[];
};

export type TxPayload = {
  tx: string;
  signature?: RawSignature;
};

type Buf = any; // Placeholder for buffer

export type UTXO = BTCLegacyUTXO | BTCSegwitUTXO | StdUTXO;

export type BTCLegacyUTXO = StdUTXO & { nonWitnessUtxo: Buf };

export type BTCSegwitUTXO = StdUTXO & { witnessUtxoScript: Buf };

export type StdUTXO = { confirmed?: boolean; hash: string; index: number; value: number };

export const BaseUTXOType = 'b';

export const SegwitUTXOType = 'bs';

export const LegacyUTXOType = 'bl';

export type UTXOType = 'b' | 'bs' | 'bl';

export type RawSignature = {
  r: string;
  s: string;
  v: number;
};

export type GenerateTxInput = {
  to: string;
  amount: number;
  utxos?: UTXO[];
  feeRate?: number;
  nonce?: number;
  gasPrice?: string;
  blockHash?: string;
  memo?: string;
  extraParams?: Map<string, any>;
  chainId?: number;
};
