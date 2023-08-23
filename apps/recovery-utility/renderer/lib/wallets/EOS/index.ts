import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { KeyType, privateKeyToString } from 'eosjs/dist/eosjs-numeric';
import { EOS as BaseEOS } from '@fireblocks/wallet-derivation';
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces';
import superjson from 'superjson';
import { GenerateTxInput, TxPayload } from '../types';
import { SigningWallet } from '../SigningWallet';

export class EOS extends BaseEOS implements SigningWallet {
  public async generateTx({ extraParams }: GenerateTxInput): Promise<TxPayload> {
    const keyBuffer = Buffer.from(this.privateKey!.replace('0x', ''), 'hex');
    const prv = privateKeyToString({
      type: KeyType.k1,
      data: keyBuffer,
    });
    const signer = new JsSignatureProvider([prv]);
    const txPush: PushTransactionArgs = superjson.parse<PushTransactionArgs>(extraParams!.get(this.KEY_TX));
    const chainId = extraParams!.get(this.KEY_CHAIN_ID);

    this.utilityLogger.debug(`EOS: Signing tx: ${JSON.stringify(txPush, null, 2)}`);

    const signedTx: PushTransactionArgs = await signer.sign({
      chainId,
      requiredKeys: [this.address],
      serializedTransaction: Buffer.from(Object.values(txPush.serializedTransaction)),
      serializedContextFreeData: txPush.serializedContextFreeData
        ? Buffer.from(Object.values(txPush.serializedContextFreeData!))
        : txPush.serializedContextFreeData,
      abis: [],
    });

    return {
      tx: superjson.stringify(signedTx),
    };
  }
}
