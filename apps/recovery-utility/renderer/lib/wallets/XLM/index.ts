import { Stellar as BaseStellar } from '@fireblocks/wallet-derivation';
import {
  Account,
  AccountResponse,
  Asset,
  Keypair,
  Memo,
  Networks,
  Operation,
  Server,
  StrKey,
  Transaction,
  TransactionBuilder,
  xdr,
} from 'stellar-sdk';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class Stellar extends BaseStellar implements SigningWallet {
  public async generateTx({ extraParams, feeRate, to, amount, memo }: GenerateTxInput): Promise<TxPayload> {
    const accountId = extraParams?.get(this.KEY_ACCOUNT_ID);
    const sequence = extraParams?.get(this.KEY_SEQUENCE);
    const txBuilder = new TransactionBuilder(new Account(accountId, sequence), { fee: `${feeRate}` });
    txBuilder
      .addOperation(
        Operation.payment({
          destination: to,
          asset: Asset.native(),
          amount: `${Math.round((amount - feeRate! / 1_000_000 - this.MIN_BALANCE_SMALLEST_UNITS) * 10_000_000) / 10_000_000}`, // Floating point shinanigans
        }),
      )
      .setTimeout(600)
      .setNetworkPassphrase(this.isTestnet ? Networks.TESTNET : Networks.PUBLIC);
    if (memo) {
      txBuilder.addMemo(new Memo('text', memo));
    }

    const tx = txBuilder.build();
    this.utilityLogger.info(`Stellar: Signing tx: ${JSON.stringify(tx.toXDR(), null, 2)}`);
    const sig = await this.sign(tx.hash());
    tx.addSignature(this.address, Buffer.from(sig).toString('base64'));
    return {
      tx: tx.toEnvelope().toXDR('hex'),
    };
  }
}
