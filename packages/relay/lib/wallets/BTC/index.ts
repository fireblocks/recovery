import { Network, networks, Psbt } from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import { fromHex } from "uint8array-tools";
import { BaseWallet } from "../BaseWallet";
import axios from "axios";

export class Bitcoin implements BaseWallet {
  private static ECPair = ECPairFactory(ecc);

  private readonly network: Network;

  private readonly isTestnet: boolean;

  private readonly baseUrl: string;

  private readonly legacy: boolean;

  constructor(private readonly address: string, isTestnet: boolean) {
    // Only legacy addresses have uper case chars. If by chnace there is no upper case letter (possible), then we also check for tb1 (definite segwit) or for bc1
    this.legacy = !address.startsWith("tb1") && !address.startsWith("bc1");
    for (let i = 0; i < address.length; i++) {
      this.legacy =
        this.legacy ||
        (address.charAt(i) === address.charAt(i).toUpperCase() &&
          !["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(
            address.charAt(i)
          ));
    }
    this.network = networks[isTestnet ? "testnet" : "bitcoin"];
    this.isTestnet = isTestnet;
    this.baseUrl = isTestnet
      ? "https://blockstream.info/testnet/api"
      : "https://blockstream.info/api";
  }

  private async _getAddressUTXOs() {
    const addressRes = await fetch(
      `${this.baseUrl}/address/${this.address}/utxo`
    );

    return (await addressRes.json()) as UTXOSummary[];
  }

  public async _getAddressBalance() {
    const addressRes = await fetch(`${this.baseUrl}/address/${this.address}`);

    const addressJson = (await addressRes.json()) as AddressSummary;
    return addressJson;
  }

  public async _getSegwitInfo(txHash: string, index: number) {
    const utxo = (await (
      await fetch(`${this.baseUrl}/tx/${txHash}`)
    ).json()) as FullUTXO;
    const { scriptpubkey, value } = utxo.vout[index];
    return {
      scriptpubkey,
      value,
    };
  }

  public async _getNonSegwitInfo(txHash: string) {
    const rawTx = await (
      await fetch(`${this.baseUrl}/tx/${txHash}/raw`)
    ).arrayBuffer();
    return { nonWitnessUtxo: Buffer.from(rawTx) };
  }

  public async _getFeeRate() {
    const feeRes = await fetch(`${this.baseUrl}/fee-estimates`);

    const feeRate = (await feeRes.json())["3"];
    return feeRate;
  }

  public async getBalance() {
    const { chain_stats } = await this._getAddressBalance();
    const balance = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum;
    return balance;
  }

  public async sendTransaction(
    privateKeyHex: string,
    to: string,
    amount: number
  ) {
    if (this.legacy && (to.startsWith("tb1") || to.startsWith("bc1"))) {
      return "Can't transfer from legacy to segwit.";
    }

    const satAmount = amount * 100000000;
    const tx = new Psbt({ network: this.network });
    const utxos = await this._getAddressUTXOs();

    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];
      this.legacy
        ? await this.addNonSegwitInput(tx, utxo)
        : await this.addSegwitInput(tx, utxo);
    }

    const feeRate = await this._getFeeRate();
    const vbytes = this.legacy
      ? 148 * utxos.length + 34 + 10
      : 68 * utxos.length + 31 + 10.5;

    const fee = parseInt(feeRate) * Math.ceil(vbytes);
    const actualAmount = satAmount - fee;
    const balance = await this.getBalance();
    if (actualAmount > balance) {
      return `Insufficient funds, tried to move ${satAmount} satoshi (after fee: ${actualAmount} satoshi) - current account balance is ${balance}.`;
    }

    tx.addOutput({
      address: to,
      value: actualAmount,
    });

    const signer = Bitcoin.ECPair.fromPrivateKey(
      Buffer.from(privateKeyHex, "hex")
    );
    tx.signAllInputs(signer);
    tx.finalizeAllInputs();

    // Broadcast
    try {
      const txBroadcast = await axios({
        method: "POST",
        url: `${this.baseUrl}/tx`,
        data: tx.extractTransaction().toHex(),
      });
      const txHash = txBroadcast.data as string;
      return txHash;
    } catch (e) {
      return `${e}`;
    }
  }

  public async addSegwitInput(tx: Psbt, utxo: UTXOSummary) {
    const { scriptpubkey, value } = await this._getSegwitInfo(
      utxo.txid,
      utxo.vout
    );
    tx.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: Buffer.from(scriptpubkey, "hex"),
        value: value,
      },
    });
  }

  public async addNonSegwitInput(tx: Psbt, utxo: UTXOSummary) {
    const { nonWitnessUtxo } = await this._getNonSegwitInfo(utxo.txid);
    tx.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo,
    });
  }
}

interface AddressSummary {
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

interface FullUTXO {
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
    }
  ];
  vout: [
    {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    }
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

interface UTXOSummary {
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
