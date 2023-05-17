export type ADAUTXO = {
  address: string;
  tx_hash: string;
  tx_index: number;
  output_index: number;
  amount: {
    unit: string;
    quantity: string;
  }[];
  block: string;
  data_hash: string | undefined;
  inline_datum: string | undefined;
  reference_script_hash: string | undefined;
};

export class BlockFrostAPI {
  private baseUrl: string;

  constructor(private projectId: string, isTestnet: boolean) {
    this.baseUrl = isTestnet ? 'https://cardano-preprod.blockfrost.io/api/v0' : 'https://cardano-mainnet.blockfrost.io/api/v0';
  }

  async txSubmit(tx: Buffer): Promise<string> {
    const res = await fetch(`${this.baseUrl}/tx/submit`, {
      method: 'POST',
      body: tx,
      headers: {
        project_id: this.projectId,
        'Content-Type': 'application/cbor',
      },
    });

    const txHex = await res.text();

    return txHex;
  }

  async getUtxos(addr: string): Promise<ADAUTXO[]> {
    const utxos: ADAUTXO[] = [];
    const page = 1;
    let resultLength = 0;

    do {
      const params = new URLSearchParams({ page: page.toString(), count: '100' });

      const res = await fetch(`${this.baseUrl}/addresses/${addr}/utxos?${params.toString()}`, {
        headers: {
          project_id: this.projectId,
        },
      });

      const pageResult: ADAUTXO[] = await res.json();

      resultLength = pageResult.length;

      utxos.push(...pageResult);
    } while (resultLength !== 100);

    return utxos;
  }
}
