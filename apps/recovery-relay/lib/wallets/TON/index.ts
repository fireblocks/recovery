import { Ton as BaseTon } from '@fireblocks/wallet-derivation';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { beginCell, Cell, fromNano } from '@ton/core';
import { AccountData } from '../types';
import { defaultTonWalletV4R2code } from './tonParams';
import axios from 'axios';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';

export class Ton extends BaseTon implements LateInitConnectedWallet {
  public memo: string | undefined;

  public updateDataEndpoint(memo?: string): void {
    this.memo = memo;
  }

  public getLateInitLabel(): string {
    throw new Error('Method not implemented.');
  }

  public rpcURL: string | undefined;

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
  }

  private client: TonClient | undefined;

  private init() {
    this.client = new TonClient({
      endpoint: this.rpcURL!,
    });
  }

  private tonWallet = WalletContractV4.create({ publicKey: Buffer.from(this.publicKey.replace('0x', ''), 'hex'), workchain: 0 });

  public async getBalance(): Promise<number> {
    if (this.client) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const contract = this.client.open(this.tonWallet);
      return Number(fromNano(await contract.getBalance()));
    } else {
      this.relayLogger.error('TON: Client failed to initialize');
      throw new Error('TON: Client failed to initialize');
    }
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      // init the TonClient
      this.init();

      // parse the tx back to Ton Cell
      const body = Cell.fromBoc(Buffer.from(tx, 'base64'))[0];
      const pubKey = Buffer.from(this.publicKey.replace('0x', ''), 'hex');
      const externalMessage = beginCell().storeUint(0b10, 2).storeUint(0, 2).storeAddress(this.tonWallet.address).storeCoins(0);
      const seqno = await this.getSeqno();
      if (seqno === 0) {
        // for the fist transaction we initialize a state init struct which consists of init struct and code
        externalMessage
          .storeBit(1) // We have State Init
          .storeBit(1) // We store State Init as a reference
          .storeRef(this.createStateInit(pubKey)); // Store State Init as a reference
      } else {
        externalMessage.storeBit(0); // We don't have state init
      }
      const finalExternalMessage = externalMessage.storeBit(1).storeRef(body).endCell();

      if (this.client) {
        // broadcast Tx and calc TxHash
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.client.sendFile(finalExternalMessage.toBoc());
        const txHash = finalExternalMessage.hash().toString('hex');
        this.relayLogger.debug(`TON: Tx broadcasted: ${txHash}`);
        return txHash;
      } else {
        throw new Error('TON: Client failed to initialize');
      }
    } catch (e) {
      this.relayLogger.error(`TON: Error broadcasting tx: ${e}`);
      if (axios.isAxiosError(e)) {
        this.relayLogger.error(`Axios error: ${e.message}\n${e.response?.data}`);
      }
      throw e;
    }
  }

  public async prepare(): Promise<AccountData> {
    // init the TonClient
    this.init();
    // get the balance, returned in nanoTon
    const balance = await this.getBalance();

    // fee for regular tx is hardcoded to 0.02 TON
    const feeRate = 0.02;
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // get seqno of the wallet, set it as exrtaParams
    const seqno = await this.getSeqno();
    const extraParams = new Map<string, any>();
    extraParams.set('seqno', seqno);

    const preperedData = {
      balance,
      memo: this.memo,
      feeRate,
      extraParams,
      insufficientBalance: balance < 0.005,
    } as AccountData;

    return preperedData;
  }
  private async getSeqno() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return await this.client!.open(this.tonWallet).getSeqno();
  }

  private createStateInit(pubKey: Buffer) {
    // the initial data cell our contract will hold. Wallet V4 has an extra value for plugins in the end
    const dataCell = beginCell()
      .storeUint(0, 32) // Seqno 0 for the first tx
      .storeUint(698983191, 32) // Subwallet ID -> https://docs.ton.org/v3/guidelines/smart-contracts/howto/wallet#subwallet-ids
      .storeBuffer(pubKey) // Public Key
      .storeBit(0) // only for Wallet V4
      .endCell();

    // we take a boiler place already made WalletV4R2 code
    const codeCell = Cell.fromBoc(Buffer.from(defaultTonWalletV4R2code, 'base64'))[0];
    const stateInit = beginCell()
      .storeBit(0) // No split_depth
      .storeBit(0) // No special
      .storeBit(1) // We have code
      .storeRef(codeCell)
      .storeBit(1) // We have data
      .storeRef(dataCell)
      .storeBit(0) // No library
      .endCell();
    return stateInit;
  }
}
