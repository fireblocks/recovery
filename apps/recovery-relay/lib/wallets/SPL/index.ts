import * as web3 from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import { Solana as BaseSolana, Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';
import { ipcRenderer } from 'electron';
import { splAssets } from './solana_assets';

export class SPL extends BaseSolana implements ConnectedWallet {
  public rpcURL: string | undefined;
  public solConnection: web3.Connection | undefined;

  public mint?: string;
  public amount?: number;

  constructor(input: Input) {
    super(input);
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.solConnection = new web3.Connection(url, {
      commitment: 'confirmed',
      fetch: async (input: string | URL | Request, init) => {
        const res = await ipcRenderer.invoke('main_proc_fetch', input, init);
        return new Response(res);
      },
    });
  }

  public async getBalance(): Promise<number> {
    if (!this.mint) throw new Error('mint not set');

    const mintPubkey = new web3.PublicKey(this.mint);
    const ata = await getAssociatedTokenAddress(mintPubkey, this.web3PubKey);
    ata.toString();
    try {
      const { value } = await this.solConnection!.getTokenAccountBalance(ata);

      this.relayLogger.debug('SPL Token balance info', value);

      const amount = parseFloat(value.amount);
      const decimals = value.decimals;

      return amount / 10 ** decimals;
    } catch (err) {
      if ((err as Error).message.includes('could not find account')) {
        this.relayLogger.warn('SPL Token account does not exist. Returning 0 balance.');
        return 0;
      }

      this.relayLogger.error('Error fetching SPL token balance', err);
      throw err;
    }
  }

  public async prepare(toAddress: string): Promise<AccountData> {
    this.mint = splAssets.find((asset) => asset.legacyId === this.assetId)?.onchain.address;
    if (!this.mint) throw new Error('mint not set');
    const mintPubkey = new web3.PublicKey(this.mint);

    const toPubkey = new web3.PublicKey(toAddress);

    let createAccountInstruction: web3.TransactionInstruction | null = null;
    let initializeMintInstruction: web3.TransactionInstruction | null = null;

    const fromATA = await getAssociatedTokenAddress(mintPubkey, this.web3PubKey);
    const toATA = await getAssociatedTokenAddress(mintPubkey, this.web3PubKey); // dummy to self

    let { blockhash } = await this.solConnection!.getLatestBlockhash();

    // Build a dummy SPL token transfer tx (just for fee estimation)
    const dummyTx = new web3.Transaction({
      feePayer: this.web3PubKey,
      blockhash,
      lastValidBlockHeight: 999_999, // safe default
    });

    dummyTx.add(
      createTransferInstruction(
        fromATA,
        toATA,
        this.web3PubKey,
        1, // 1 unit for simulation
      ),
    );

    const feeForTxLamports = (await this.solConnection!.getFeeForMessage(dummyTx.compileMessage())).value ?? 0;
    const feeForTx = feeForTxLamports / web3.LAMPORTS_PER_SOL;

    const accountBalance = await this.getBalance();
    const balanceAfterFee = Math.floor((accountBalance - feeForTx) * web3.LAMPORTS_PER_SOL) / web3.LAMPORTS_PER_SOL;

    // Refresh blockhash to give real tx more time
    blockhash = (await this.solConnection!.getLatestBlockhash()).blockhash;

    const extraParams = new Map<string, string>();
    extraParams.set(this.KEY_RECENT_BLOCKHASH, blockhash);
    extraParams.set('mint', this.mint!);

    try {
      const toAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey, false);
      console.log(toAccount);
      await getAccount(this.solConnection!, toAccount);
    } catch (err) {
      if (err instanceof TokenAccountNotFoundError) {
        if (err instanceof TokenAccountNotFoundError) {
          this.utilityLogger.warn('SPL: To ATA does not exist. Signer must add ATA creation instruction');
          extraParams.set('createATA', 'true');
        }
      } else {
        throw err; // Unexpected error
      }
    }

    const preparedData: AccountData = {
      balance: balanceAfterFee,
      insufficientBalance: balanceAfterFee < 0.00000001,
      extraParams,
    };

    this.relayLogger.logPreparedData('SPL', preparedData);
    return preparedData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    try {
      const hash = await this.solConnection!.sendRawTransaction(Buffer.from(txHex, 'hex'));
      this.relayLogger.debug(`SPL: Tx broadcasted: ${hash}`);
      return hash;
    } catch (e) {
      this.relayLogger.error(`SPL: Error broadcasting tx: ${e}`);
      throw e;
    }
  }
}
