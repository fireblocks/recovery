import { Ton as BaseTon } from '@fireblocks/wallet-derivation';
import { JettonMaster, TonClient, WalletContractV4 } from '@ton/ton';
import { Address, beginCell, Cell, fromNano, toNano } from '@ton/core';
import { AccountData } from '../types';
import { defaultTonWalletV4R2code } from '../TON/tonParams';
import axios from 'axios';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';

export class Jetton extends BaseTon implements LateInitConnectedWallet {
  public memo: string | undefined;
  public tokenAddress: string | undefined;
  public decimals: number | undefined;

  public setTokenAddress(address: string) {
    this.tokenAddress = address;
  }

  public setDecimals(decimals: number) {
    this.decimals = decimals;
  }

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

  private async getContractAddress(): Promise<Address | undefined> {
    const jettonMasterAddress = Address.parse(this.tokenAddress!);
    const walletAddress = Address.parse(this.address);
    const jettonMaster = this?.client?.open(JettonMaster.create(jettonMasterAddress));
    return await jettonMaster?.getWalletAddress(walletAddress);
  }

  public async getBalance(): Promise<number> {
    if (this.client) {
      if (!this.tokenAddress) {
        this.relayLogger.error('TON Jettons: Jetton token address unavailable');
        throw new Error('TON Jettons: Jetton token address unavailable');
      }

      const contractAddress = await this.getContractAddress();
      if (!contractAddress) {
        this.relayLogger.error(`TON Jettons: wallet's contract address unavailable`);
        throw new Error(`TON Jettons: wallet's contract address unavailable`);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { stack } = await this.client.runMethod(contractAddress, 'get_wallet_data');
      const normalizingFactor = 10 ** this.decimals!;

      return stack.readNumber() / normalizingFactor;
    } else {
      this.relayLogger.error('TON Jettons: Client failed to initialize');
      throw new Error('TON Jettons: Client failed to initialize');
    }
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      // init the TonClient
      this.init();

      // parse the tx back to Ton Cell
      const body = Cell.fromBoc(Buffer.from(tx, 'base64'))[0];
      const pubKey = Buffer.from(this.publicKey.replace('0x', ''), 'hex');
      const externalMessage = beginCell()
        .storeUint(0b10, 2)
        .storeUint(0, 2)
        .storeAddress(Address.parse(this.address))
        .storeCoins(0);

      const seqno = await this.getSeqno();
      if (seqno === 0) {
        // for the fist transaction we initialize a state init struct which consists of init struct and code
        externalMessage
          .storeBit(1) // We have State Init
          .storeBit(1) // We store State Init as a reference
          .storeRef(await this.createStateInit(pubKey)); // Store State Init as a reference
      } else {
        externalMessage.storeBit(0); // We don't have state init
      }
      const finalExternalMessage = externalMessage.storeBit(1).storeRef(body).endCell();

      if (this.client) {
        // broadcast Tx and calc TxHash
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.client.sendFile(finalExternalMessage.toBoc());
        const txHash = finalExternalMessage.hash().toString('hex');
        this.relayLogger.debug(`Jetton: Tx broadcasted: ${txHash}`);
        return txHash;
      } else {
        throw new Error('Jetton: Client failed to initialize');
      }
    } catch (e) {
      this.relayLogger.error(`Jetton: Error broadcasting tx: ${e}`);
      if (axios.isAxiosError(e)) {
        this.relayLogger.error(`Axios error: ${e.message}\n${e.response?.data}`);
      }
      throw e;
    }
  }

  public async prepare(): Promise<AccountData> {
    // init the TonClient
    this.init();

    const jettonBalance = await this.getBalance();
    const contract = this.client!.open(this.tonWallet);
    const tonBalance = await contract.getBalance();

    // fee for token tx is hardcoded to 0.1 TON
    const feeRate = Number(toNano(0.1));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // get seqno of the wallet, set it as exrtaParams
    const seqno = await this.getSeqno();

    // get the contract address of the wallet
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const contractAddress = await this.getContractAddress();

    // set extraParams
    const extraParams = new Map<string, any>();
    extraParams.set('seqno', seqno);
    extraParams.set('contract-address', contractAddress?.toString({ bounceable: true, testOnly: false }));
    extraParams.set('decimals', this.decimals);

    const preperedData = {
      balance: jettonBalance,
      memo: this.memo,
      feeRate,
      extraParams,
      insufficientBalance: jettonBalance <= 0,
      insufficientFeeBalance: tonBalance < feeRate,
    } as AccountData;

    return preperedData;
  }
  private async getSeqno() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return await this.client!.open(this.tonWallet).getSeqno();
  }

  private async createStateInit(pubKey: Buffer): Promise<Cell> {
    // the initial data cell our contract will hold. Wallet V4 has an extra value for plugins in the end
    const dataCell = beginCell()
      .storeUint(await this.getSeqno(), 32) // Seqno 0 for the first tx
      .storeUint(698983191, 32) // Subwallet ID -> https://docs.ton.org/v3/guidelines/smart-contracts/howto/wallet#subwallet-ids
      .storeBuffer(pubKey)
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
