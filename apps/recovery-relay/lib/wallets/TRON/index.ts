import { Tron as BaseTron, Input } from '@fireblocks/wallet-derivation';
import superjson from 'superjson';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Tron extends BaseTron implements ConnectedWallet {
  private tronWeb;

  constructor(input: Input) {
    super(input);
    const TronWeb = require('tronweb');
    const { HttpProvider } = TronWeb.providers;
    const endpointUrl = input.isTestnet ? 'https://api.shasta.trongrid.io' : 'https://api.trongrid.io';
    const fullNode = new HttpProvider(endpointUrl);
    const solidityNode = new HttpProvider(endpointUrl);
    const eventServer = new HttpProvider(endpointUrl);
    this.tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
  }

  public async getBalance(): Promise<number> {
    return ((await this.tronWeb.trx.getBalance(this.address)) as number) / 1_000_000;
  }

  public async prepare(to?: string): Promise<AccountData> {
    const balance = await this.getBalance();
    const blockData = await this.tronWeb.fullNode.request('wallet/getblock', { detail: false }, 'post');
    const metadata = {
      ref_block_bytes: blockData.block_header.raw_data.number.toString(16).slice(-4).padStart(4, '0'),
      ref_block_hash: blockData.blockID.slice(16, 32),
      expiration: blockData.block_header.raw_data.timestamp + 600 * 1000,
      timestamp: blockData.block_header.raw_data.timestamp,
    };

    // let tx = await this.tronWeb.transactionBuilder.sendTrx(to, balance * 1_000_000, this.address);
    // tx = await this.tronWeb.transactionBuilder.extendExpiration(tx, 600); // 10 minutes
    const extraParams = new Map<string, any>();
    // extraParams.set(this.KEY_TX, superjson.stringify(tx));
    extraParams.set(this.KEY_METADATA, metadata);
    return {
      balance,
      extraParams,
    };
  }

  public async broadcastTx(txHex: string): Promise<string> {
    const tx = superjson.parse<object>(txHex);
    const hash = await this.tronWeb.trx.sendRawTransaction(tx);
    if ('code' in hash) {
      throw new Error(hash.code);
    }
    //@ts-ignore
    return hash.txid;
  }
}
