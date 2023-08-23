import { Polkadot as BaseDOT, Input } from '@fireblocks/wallet-derivation';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { construct } from '@substrate/txwrapper-polkadot';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Polkadot extends BaseDOT implements ConnectedWallet {
  private provider: WsProvider;

  private api: ApiPromise | undefined;

  constructor(input: Input) {
    super(input);
    this.provider = new WsProvider(input.isTestnet ? 'wss://westend-rpc.polkadot.io' : 'wss://rpc.polkadot.io');
  }

  public async getBalance(): Promise<number> {
    await this._getApi();
    const api = this.api!;
    // @ts-ignore
    const { data: balance } = await api.query.system.account(this.address);
    return balance.free.toNumber() / 10 ** 10;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    //@ts-ignore
    const { nonce } = await this.api!.query.system.account(this.address);
    const genesisHash = this.api!.genesisHash.toHex();
    const blockHash = (await this.api!.rpc.chain.getBlockHash()).toHex();
    const blockNum = (await this.api!.rpc.chain.getBlock()).block.header.number.toNumber();
    const specVersion = this.api!.runtimeVersion.specVersion.toNumber();
    const specName = this.api!.runtimeVersion.specName.toHuman();
    const transactionVersion = this.api!.runtimeVersion.transactionVersion.toNumber();
    const rpc = (await this.api!.rpc.state.getMetadata()).toHex();

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_BLOCK_HASH, blockHash);
    extraParams.set(this.KEY_BLOCK_NUM, blockNum);
    extraParams.set(this.KEY_SPEC_VERSION, specVersion);
    extraParams.set(this.KEY_GENESIS_HASH, genesisHash);
    extraParams.set(this.KEY_SPEC_NAME, specName);
    extraParams.set(this.KEY_TX_VER, transactionVersion);

    const preparedData = {
      balance,
      nonce: nonce.toNumber(),
      extraParams,
    };

    this.relayLogger.debug(`Polkadot: Prepared data: ${JSON.stringify(preparedData, null, 2)}`);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    await this._getApi();
    try {
      const txHash = construct.txHash(tx);
      await this.api!.rpc.author.submitAndWatchExtrinsic(tx);
      this.relayLogger.debug(`Polkadot: Broadcasted tx: ${txHash}`);
      return txHash;
    } catch (e) {
      this.relayLogger.error(`Polkadot: Error broadcasting tx: ${(e as Error).message}`);
      throw e;
    }
  }

  private async _getApi(): Promise<void> {
    if (this.api) {
      return;
    }
    this.api = await ApiPromise.create({ provider: this.provider });
  }
}
