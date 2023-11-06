import { Kusama as BaseKSM, Input } from '@fireblocks/wallet-derivation';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { construct } from '@substrate/txwrapper-polkadot';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Kusama extends BaseKSM implements ConnectedWallet {
  protected provider: WsProvider;

  private api: ApiPromise | undefined;

  constructor(input: Input) {
    super(input);
    if (input.isTestnet) {
      throw new Error("Can't use testnet with Kusama, please use Westend");
    }
    this.provider = new WsProvider('wss://kusama-rpc.polkadot.io');
  }

  public async getBalance(): Promise<number> {
    await this._getApi();
    const api = this.api!;
    // @ts-ignore
    const { data: balance } = await api.query.system.account(this.address);
    return balance.free.toNumber() / 10 ** 12;
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

    this.relayLogger.logPreparedData('Kusama', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    await this._getApi();
    try {
      const txHash = construct.txHash(tx);
      await this.api!.rpc.author.submitAndWatchExtrinsic(tx);
      this.relayLogger.debug(`Kusama: Tx broadcasted: ${txHash}`);
      return txHash;
    } catch (e) {
      this.relayLogger.error(`Kusama: Error broadcasting tx: ${e}`);
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
