import { Stellar as BaseStellar } from '@fireblocks/wallet-derivation';
import { Account, Asset, Memo, Networks, Operation, TransactionBuilder } from 'stellar-sdk';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class Stellar extends BaseStellar implements SigningWallet {
  public async generateTx({ extraParams, feeRate, to, amount, memo }: GenerateTxInput): Promise<TxPayload> {
    const accountId = extraParams?.get(this.KEY_ACCOUNT_ID);
    const sequence = extraParams?.get(this.KEY_SEQUENCE);
    const destinationExists = extraParams?.get('DESTINATION_EXISTS');
    const accountBalance = extraParams?.get('ACCOUNT_BALANCE');

    const txBuilder = new TransactionBuilder(new Account(accountId, sequence), {
      fee: `${feeRate}`,
      networkPassphrase: this.isTestnet ? Networks.TESTNET : Networks.PUBLIC,
    });

    if (!destinationExists) {
      // For new accounts, use Create Account operation
      // Calculate maximum we can send while keeping minimum reserves
      const feeInXLM = feeRate! / 1_000_000;
      const minimumReserve = 1; // 1 XLM
      const maxSendable = accountBalance - feeInXLM - minimumReserve;

      if (maxSendable < 1.0) {
        throw new Error(
          `Insufficient balance to create account. Need at least ${
            1.0 + feeInXLM + minimumReserve
          } XLM, but have ${accountBalance} XLM`,
        );
      }

      // Use the requested amount or maximum sendable
      const sendAmount = Math.min(amount, maxSendable);
      const finalAmount = Math.max(sendAmount, 1.0); // Ensure minimum 1 XLM for account creation

      txBuilder.addOperation(
        Operation.createAccount({
          destination: to,
          startingBalance: finalAmount.toString(),
        }),
      );
    } else {
      // For existing accounts, use Payment operation
      const feeInXLM = feeRate! / 1_000_000;
      const minimumReserve = this.MIN_BALANCE_SMALLEST_UNITS;
      const maxSendable = accountBalance - feeInXLM - minimumReserve;

      if (maxSendable <= 0) {
        throw new Error(
          `Insufficient balance. Need to keep ${minimumReserve} XLM reserve plus ${feeInXLM} XLM fee, but only have ${accountBalance} XLM`,
        );
      }

      const sendAmount = Math.min(amount, maxSendable);

      txBuilder.addOperation(
        Operation.payment({
          destination: to,
          asset: Asset.native(),
          amount: sendAmount.toString(),
        }),
      );
    }

    txBuilder.setTimeout(600);

    if (memo) {
      txBuilder.addMemo(new Memo('text', memo));
    }

    const tx = txBuilder.build();
    this.utilityLogger.logSigningTx('Stellar', tx.toEnvelope());

    const sig = await this.sign(tx.hash());
    tx.addSignature(this.address, Buffer.from(sig).toString('base64'));

    return {
      tx: tx.toEnvelope().toXDR('hex'),
    };
  }
}
