import { Polkadot as BaseDOT, Input } from '@fireblocks/wallet-derivation';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { construct } from '@substrate/txwrapper-polkadot';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Polkadot extends BaseDOT implements ConnectedWallet {
  private provider: WsProvider;

  private polkadotApi: ApiPromise | undefined;

  constructor(input: Input) {
    super(input);
    this.provider = new WsProvider(input.isTestnet ? 'wss://westend-rpc.polkadot.io' : 'wss://rpc.polkadot.io');
  }

  public async getBalance(): Promise<number> {
    await this._getApi();
    const api = this.polkadotApi!;
    // @ts-ignore
    const { data: balance } = await api.query.system.account(this.address);
    return balance.free.toNumber() / 10 ** 10;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    //@ts-ignore
    const { nonce } = await this.polkadotApi!.query.system.account(this.address);
    const genesisHash = this.polkadotApi!.genesisHash.toHex();
    const blockHash = (await this.polkadotApi!.rpc.chain.getBlockHash()).toHex();
    const blockNum = (await this.polkadotApi!.rpc.chain.getBlock()).block.header.number.toNumber();
    const specVersion = this.polkadotApi!.runtimeVersion.specVersion.toNumber();
    const specName = this.polkadotApi!.runtimeVersion.specName.toHuman();
    const transactionVersion = this.polkadotApi!.runtimeVersion.transactionVersion.toNumber();

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

    this.relayLogger.logPreparedData('Polkadot', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    await this._getApi();
    try {
      const txHash = construct.txHash(tx);
      await this.polkadotApi!.rpc.author.submitAndWatchExtrinsic(tx);
      this.relayLogger.debug(`Polkadot: Broadcasted tx: ${txHash}`);
      return txHash;
    } catch (e) {
      this.relayLogger.error(`Polkadot: Error broadcasting tx: ${(e as Error).message}`);
      throw e;
    }
  }

  private async _getApi(): Promise<void> {
    if (this.polkadotApi) {
      return;
    }
    this.polkadotApi = await ApiPromise.create({ provider: this.provider });
  }
}
