import * as bitcoin from "bitcoinjs-lib";
import wif from "wif";
import * as ecc from "tiny-secp256k1";
import ECPairFactory, { ECPairInterface } from "ecpair";
import { BaseWallet } from "../BaseWallet";

export class Bitcoin implements BaseWallet {
  private static ECPair = ECPairFactory(ecc);

  private readonly network: bitcoin.Network;

  private readonly keypair: ECPairInterface;

  constructor(privateKeyHex: string, isTestnet: boolean) {
    this.network = bitcoin.networks[isTestnet ? "testnet" : "bitcoin"];

    const privateKeyBuffer = Buffer.from(privateKeyHex, "hex");

    const privateKeyWif = wif.encode(
      isTestnet ? 239 : 128,
      privateKeyBuffer,
      true
    );

    this.keypair = Bitcoin.ECPair.fromWIF(privateKeyWif, this.network);
  }

  public async getAddress(isSegWit = false) {
    const payment: bitcoin.Payment = {
      pubkey: this.keypair.publicKey,
      network: this.network,
    };

    const { address } =
      bitcoin.payments[isSegWit ? "p2wpkh" : "p2pkh"](payment);

    if (!address) {
      throw new Error("Could not get address");
    }

    return address;
  }

  private async _getAddressData() {
    const address = await this.getAddress();

    const addressRes = await fetch(
      `https://blockchain.info/rawaddr/${address}?limit=50`
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

  public async sendTransaction(to: string, amount: number) {
    // to build and broadcast to the actual Bitcoin network, see https://github.com/bitcoinjs/bitcoinjs-lib/issues/839

    const address = await this.getAddress();

    const addressData = await this._getAddressData();

    console.info({
      network: this.network,
      privateKey: this.keypair.privateKey?.toString("hex"),
      publicKey: this.keypair.publicKey.toString("hex"),
      address,
    });

    console.info({ addressData });

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

    return "";
  }
}
