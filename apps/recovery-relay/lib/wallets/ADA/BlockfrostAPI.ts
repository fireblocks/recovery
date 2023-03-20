/* eslint-disable no-await-in-loop */
import axios from 'axios';

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
    const res = await axios({
      method: 'post',
      data: tx,
      url: `${this.baseUrl}/tx/submit`,
      headers: {
        project_id: this.projectId,
        'Content-type': 'application/cbor',
      },
    });
    return res.data as string;
  }

  async getUtxos(addr: string): Promise<ADAUTXO[]> {
    const utxos: ADAUTXO[] = [];
    const page = 1;
    let resultLength = 0;
    do {
      const pageResult = (
        await axios({
          method: 'get',
          url: `${this.baseUrl}/addresses/${addr}/utxos`,
          data: {
            page,
            count: 100,
          },
          headers: {
            project_id: this.projectId,
          },
        })
      ).data as ADAUTXO[];
      resultLength = pageResult.length;
      utxos.push(...pageResult);
    } while (resultLength !== 100);
    return utxos;
  }
}
