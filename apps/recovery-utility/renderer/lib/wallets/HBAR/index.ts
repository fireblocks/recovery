import { Hedera as BaseHBAR } from '@fireblocks/wallet-derivation';
import { TransferTransaction, TransactionId, AccountId, PublicKey } from '@hashgraph/sdk';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class Hedera extends BaseHBAR implements SigningWallet {
  public async generateTx({ to, amount, memo, extraParams }: GenerateTxInput): Promise<TxPayload> {
    const accountId = extraParams?.get(this.KEY_ACCOUNT_ID);
    const nodeIds = (extraParams?.get(this.KEY_NODE_ACCOUNT_IDS) as Array<string>).map((nodeIdString: string) =>
      AccountId.fromString(nodeIdString),
    );

    const preparedTx = new TransferTransaction()
      .addHbarTransfer(accountId, -1 * (amount - 1))
      .addHbarTransfer(to, amount - 1)
      .setTransactionMemo(memo ?? '')
      .setTransactionId(TransactionId.generate(accountId))
      .setNodeAccountIds(nodeIds);
    preparedTx._requestTimeout = 600;
    const tx = preparedTx.freeze();

    this.utilityLogger.logSigningTx('HBAR', tx);

    const pubKey = PublicKey.fromBytesED25519(Buffer.from(this.publicKey.replace('0x', ''), 'hex'));

    for (let i = 0; i < tx._signedTransactions.length; i++) {
      const signature = await this.sign(tx._signedTransactions.get(i).bodyBytes ?? new Uint8Array());
      const signedTx = tx._signedTransactions.get(i);
      if (signedTx.sigMap === null) {
        signedTx.sigMap = {};
      }
      if (signedTx.sigMap!.sigPair === null) {
        signedTx.sigMap!.sigPair = [];
      }

      signedTx.sigMap!.sigPair!.push(pubKey._toProtobufSignature(signature));

      tx._signedTransactions.set(i, signedTx);
      tx._signerPublicKeys.add(this.publicKey);
    }
    return {
      tx: Buffer.from(tx.toBytes()).toString('hex'),
    };
  }
}
