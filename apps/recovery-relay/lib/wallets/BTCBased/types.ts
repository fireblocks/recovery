export interface AddressSummary {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

export interface FullUTXO {
  txid: string;
  version: number;
  locktime: number;
  vin: [
    {
      txid: string;
      vout: number;
      prevout: {
        scriptpubkey: string;
        scriptpubkey_asm: string;
        scriptpubkey_type: string;
        scriptpubkey_address: string;
        value: number;
      };
      scriptsig: string;
      scriptsig_asm: string;
      witness: [string];
      is_coinbase: boolean;
      sequence: number;
    },
  ];
  vout: [
    {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    },
  ];
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

export interface UTXOSummary {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
}

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

export interface BlockchairAddressDetails {
  data: BlockchairAddressData[] | null;
  context: BlockchairContext;
}

export interface BlockchairAddressData {
  address: BlockchairAddress;
  transactions: string[];
  utxo: BlockchairUTXO[];
}

export interface BlockchairAddress {
  type: string;
  script_hex: string;
  balance: number;
  balance_usd: number;
  received: number;
  received_usd: number;
  spent: number;
  spent_usd: number;
  output_count: number;
  unspent_output_count: number;
  first_seen_receiving: string;
  last_seen_receiving: string;
  first_seen_spending: string;
  last_seen_spending: string;
  scripthash_type: any;
  transaction_count: number;
}

export interface BlockchairUTXO {
  block_id: number;
  transaction_hash: string;
  index: number;
  value: number;
}

export interface BlockchairContext {
  code: number;
  source?: string;
  error?: string;
  limit: string;
  offset: string;
  results: number;
  state: number;
  market_price_usd: number;
  cache: {
    live: boolean;
    duration: number;
    since: string;
    until: string;
    time: any;
  };
  api: {
    version: string;
    last_major_update: string;
    next_major_update: any;
    documentation: string;
    notice: string;
  };
  servers: string;
  time: number;
  render_time: number;
  full_time: number;
  request_cost: number;
}

export interface BlockchairBlockchainStats {
  data: BlockchairStats;
  context: BlockchairContext;
}

export interface BlockchairStats {
  blocks: number;
  transactions: number;
  outputs: number;
  circulation: number;
  blocks_24h: number;
  transactions_24h: number;
  difficulty: number;
  volume_24h: number;
  mempool_transactions: number;
  mempool_size: number;
  mempool_tps: number;
  mempool_total_fee_usd: number;
  best_block_height: number;
  best_block_hash: string;
  best_block_time: string;
  blockchain_size: number;
  average_transaction_fee_24h: number;
  inflation_24h: number;
  median_transaction_fee_24h: number;
  cdd_24h: number;
  mempool_outputs: number;
  largest_transaction_24h: LargestTransaction24h;
  nodes: number;
  hashrate_24h: string;
  inflation_usd_24h: number;
  average_transaction_fee_usd_24h: number;
  median_transaction_fee_usd_24h: number;
  market_price_usd: number;
  market_price_btc: number;
  market_price_usd_change_24h_percentage: number;
  market_cap_usd: number;
  market_dominance_percentage: number;
  next_retarget_time_estimate: string;
  next_difficulty_estimate: number;
  countdowns: any[];
  suggested_transaction_fee_per_byte_sat: number;
  hodling_addresses: number;
}

export interface LargestTransaction24h {
  hash: string;
  value_usd: number;
}

export interface BlockchairTx {
  data: BlockchairTxData;
  context: BlockchairContext;
}

export interface BlockchairTxData {
  raw_transaction: string;
  decoded_raw_transaction: BlockchairDecodedRawTransaction;
}

export interface BlockchairDecodedRawTransaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: BlockchairVin[];
  vout: BlockchairVout[];
}

export interface BlockchairVin {
  txid: string;
  vout: number;
  scriptSig: BlockchairScriptSig;
  sequence: number;
}

export interface BlockchairScriptSig {
  asm: string;
  hex: string;
}

export interface BlockchairVout {
  value: number;
  n: number;
  scriptPubKey: BlockchairScriptPubKey;
}

export interface BlockchairScriptPubKey {
  asm: string;
  hex: string;
  type: string;
}
