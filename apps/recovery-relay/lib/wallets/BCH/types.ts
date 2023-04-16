export type BCHUTXO = {
  txid: string;
  vout: number;
  scriptPubKey: string;
  amount: number;
  satoshis: number;
  height: number;
  confirmations: number;
  legacyAddress: string;
  cashAddress: string;
};
