import { Kusama as BaseKSM, Input } from '@fireblocks/wallet-derivation';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { construct } from '@substrate/txwrapper-polkadot';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Kusama extends BaseKSM implements ConnectedWallet {
  protected provider: WsProvider;

  private kusamaApi: ApiPromise | undefined;

  constructor(input: Input) {
    super(input);
    if (input.isTestnet) {
      throw new Error("Can't use testnet with Kusama, please use Westend");
    }
    this.provider = new WsProvider('wss://kusama-rpc.polkadot.io');
  }

  public async getBalance(): Promise<number> {
    await this._getApi();
    const api = this.kusamaApi!;
    // @ts-ignore
    const { data: balance } = await api.query.system.account(this.address);
    return balance.free.toNumber() / 10 ** 12;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    //@ts-ignore
    const { nonce } = await this.kusamaApi!.query.system.account(this.address);
    const genesisHash = this.kusamaApi!.genesisHash.toHex();
    const blockHash = (await this.kusamaApi!.rpc.chain.getBlockHash()).toHex();
    const blockNum = (await this.kusamaApi!.rpc.chain.getBlock()).block.header.number.toNumber();
    const specVersion = this.kusamaApi!.runtimeVersion.specVersion.toNumber();
    const specName = this.kusamaApi!.runtimeVersion.specName.toHuman();
    const transactionVersion = this.kusamaApi!.runtimeVersion.transactionVersion.toNumber();
    const rpc = (await this.kusamaApi!.rpc.state.getMetadata()).toHex();

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
      await this.kusamaApi!.rpc.author.submitAndWatchExtrinsic(tx);
      this.relayLogger.debug(`Kusama: Tx broadcasted: ${txHash}`);
      return txHash;
    } catch (e) {
      this.relayLogger.error(`Kusama: Error broadcasting tx: ${e}`);
      throw e;
    }
  }

  private async _getApi(): Promise<void> {
    if (this.kusamaApi) {
      return;
    }
    this.kusamaApi = await ApiPromise.create({ provider: this.provider });
  }
}
