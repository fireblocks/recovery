import { Celestia as BaseCelestia, Input } from '@fireblocks/wallet-derivation';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { StargateClient } from '@cosmjs/stargate';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class Celestia extends BaseCelestia implements ConnectedWallet {
  private tendermintClient: Tendermint34Client | undefined;

  private stargateClient: StargateClient | undefined;

  private rpcURL: string;

  constructor(input: Input) {
    super(input);

    this.tendermintClient = undefined;
    this.rpcURL = input.isTestnet ? 'https://celestia-mocha-rpc.publicnode.com' : 'https://celestia-rpc.publicnode.com';
  }

  public async getBalance(): Promise<number> {
    const balanceCoin = await this.stargateClient!.getBalance(this.address, 'utia');
    return parseInt(balanceCoin.amount, 10) / 1_000_000;
  }

  public async prepare(): Promise<AccountData> {
    await this.prepareClients();
    const balanceCoin = await this.stargateClient!.getBalance(this.address, 'utia');
    const { accountNumber, sequence } = await this.stargateClient!.getSequence(this.address);
    const chainId = await this.stargateClient!.getChainId();
    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_ACCOUNT_NUMBER, accountNumber);
    extraParams.set(this.KEY_CHAIN_ID, chainId);
    extraParams.set(this.KEY_SEQUENCE, sequence);
    // TODO: Add option for cusom fee
    const balance = parseInt(balanceCoin.amount, 10) / 1_000_000;
    const preparedData = { balance, extraParams, insufficientBalance: balance < 0.001 };
    this.relayLogger.logPreparedData('Celestia', preparedData);
    return preparedData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    await this.prepareClients();
    const txRaw: TxRaw = TxRaw.decode(Uint8Array.from(Buffer.from(txHex, 'hex')));
    try {
      const txRes = await this.stargateClient!.broadcastTx(TxRaw.encode(txRaw).finish());
      this.relayLogger.debug(`Celestia: Broadcasted tx: ${txRes.transactionHash}`);
      return txRes.transactionHash;
    } catch (e) {
      this.relayLogger.error(`Celestia: Error broadcasting tx: ${e}`);
      throw e;
    }
  }

  private async prepareClients(): Promise<void> {
    if (!this.tendermintClient || !this.stargateClient) {
      this.tendermintClient = await Tendermint34Client.connect(this.rpcURL);
      this.stargateClient = await StargateClient.connect(this.rpcURL);
    }
  }
}
