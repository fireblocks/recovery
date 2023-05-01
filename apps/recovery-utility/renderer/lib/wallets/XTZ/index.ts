import { Tezos as BaseTezos } from '@fireblocks/wallet-derivation';
import {
  TezosToolkit,
  EstimateProperties,
  Estimate,
  RPCTransferOperation,
  OpKind,
  DEFAULT_FEE,
  DEFAULT_GAS_LIMIT,
  DEFAULT_STORAGE_LIMIT,
  PreparedOperation,
  ForgedBytes,
  TransactionOperation,
} from '@taquito/taquito';
import { format, mergebuf, b58cencode, prefix, buf2hex, verifySignature } from '@taquito/utils';
import { OperationContents, OperationContentsTransaction } from '@taquito/rpc';
import { LocalForger, localForger } from '@taquito/local-forging';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import blake2b from 'blake2b';

export class Tezos extends BaseTezos implements SigningWallet {
  public async generateTx({ to, amount, extraParams, feeRate }: GenerateTxInput): Promise<TxPayload> {
    // https://github.com/ecadlabs/taquito/blob/master/packages/taquito/src/prepare/prepare-provider.ts#L422
    const headCounter = parseInt(extraParams?.get(this.KEY_HEAD_COUNTER), 10);
    const branch = extraParams?.get(this.KEY_BLOCK_HASH);
    const revealNeeded = extraParams?.get(this.KEY_REVEAL) as boolean;
    const estimate: {
      gas: number;
      storage: number;
      fee: number;
    } = extraParams?.get(this.KEY_ESTIMATE);
    const accountLimit: {
      fee: number;
      gasLimit: number;
      storageLimit: number;
    } = extraParams?.get(this.KEY_ACCOUNT_LIMIT);
    const transferAmount = format(
      'tz',
      'mutez',
      Math.round((amount - DEFAULT_FEE.TRANSFER / 10 ** 6) * 10 ** 6) / 10 ** 6, // Floating point shinanigans
    ).toString();
    const contents: OperationContents[] = [
      {
        kind: OpKind.TRANSACTION,
        destination: to,
        amount: transferAmount,
        source: this.address,
        fee: `${estimate.fee}`,
        gas_limit: `${estimate.gas}`,
        storage_limit: `${estimate.storage}`,
        counter: `${headCounter + 1}`,
      },
    ];

    if (revealNeeded) {
      contents.unshift({
        kind: OpKind.REVEAL,
        fee: `${accountLimit.fee > 0 ? accountLimit.fee : DEFAULT_FEE.REVEAL}`,
        gas_limit: `${DEFAULT_GAS_LIMIT.REVEAL}`,
        storage_limit: `${DEFAULT_STORAGE_LIMIT.REVEAL}`,
        public_key: b58cencode(this.publicKey.replace('0x', ''), prefix.edpk),
        counter: `${headCounter + 1}`,
        source: this.address,
      });
      (contents[1] as OperationContentsTransaction).counter = `${headCounter + 2}`;
    }

    //https://github.com/ecadlabs/taquito/blob/master/packages/taquito/src/contract/rpc-contract-provider.ts#L360
    const forger: LocalForger = localForger;

    const txBytes = await forger.forge({ branch, contents });
    const signPayload = blake2b(32)
      .update(mergebuf(new Uint8Array([3]), Buffer.from(txBytes, 'hex')))
      .digest();
    const sig = await this.sign(signPayload);

    return {
      tx: `${txBytes}${Buffer.from(sig).toString('hex')}`,
    };
  }
}
