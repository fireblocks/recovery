import * as bitcoin from "bitcoinjs-lib";
import wif from "wif";
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
    // to build and broadcast to the actual Bitcoin network, see https://github.com/bitcoinjs/bitcoinjs-lib/issues/839

    const privateKeyBuffer = fromHex(privateKeyHex) as Buffer;

    const privateKeyWif = wif.encode(
      this.isTestnet ? 239 : 128,
      privateKeyBuffer,
      true
    );

    const keypair = Bitcoin.ECPair.fromWIF(privateKeyWif, this.network);

    const addressData = await this._getAddressData();

    console.info({
      isTestnet: this.isTestnet,
      network: this.network,
      privateKey: keypair.privateKey?.toString("hex"),
      publicKey: keypair.publicKey.toString("hex"),
      address: this.address,
      addressData,
    });

    const latestTx = addressData.txs?.[0].hash;
    const fee = 26456; // TODO: calculate fee
    const whatIsLeft = addressData.final_balance - fee - amount;

    console.info({
      latestTx,
      whatIsLeft,
    });

    // const tx = new bitcoin.Transaction();

    // tx.addInput(latestTx, 1);
    // tx.addOutput(Buffer.from(to, "hex"), amount);
    // tx.addOutput(keyPair.publicKey, whatIsLeft);
    // tx.sign(0, keyPair);
    // const body = tx.build().toHex();
    // console.log(body);

    return "FAKE_TX_HASH";
  }
}
