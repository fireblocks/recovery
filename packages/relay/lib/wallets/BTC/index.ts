import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import { fromHex } from "uint8array-tools";
import { BaseWallet } from "../BaseWallet";

export class Bitcoin implements BaseWallet {
  private static ECPair = ECPairFactory(ecc);

  private readonly network: bitcoin.Network;

  private readonly isTestnet: boolean;

  constructor(private readonly address: string, isTestnet: boolean) {
    this.network = bitcoin.networks[isTestnet ? "testnet" : "bitcoin"];

    this.isTestnet = isTestnet;
  }

  private async _getAddressData() {
    const addressRes = await fetch(
      `https://blockchain.info/rawaddr/${this.address}?limit=50`
    );

    const addressData = (await addressRes.json()) as {
      hash160: string;
      address: string;
      n_tx: number;
      n_unredeemed: number;
      total_received: number;
      total_sent: number;
      final_balance: number;
      txs: any[];
    };

    return addressData;
  }

  public async getBalance() {
    const { final_balance } = await this._getAddressData();

    return final_balance;
  }

  public async sendTransaction(
    privateKeyHex: string,
    to: string,
    amount: number
  ) {
    return "not implemented";
  }
}
