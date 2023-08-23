import { Tx, TxBody, AuthInfo, MsgSend, Fee, PublicKey, RawKey, SignMode } from '@terra-money/terra.js';
import SuperJSON from 'superjson';
import { Luna as BaseLuna } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
export class Luna extends BaseLuna implements SigningWallet {
  public async generateTx({ to, amount, extraParams, memo }: GenerateTxInput): Promise<TxPayload> {
    const pubKey = PublicKey.fromData({
      '@type': '/cosmos.crypto.secp256k1.PubKey',
      key: this.publicKey,
    });

    const halfBakedFee = JSON.parse(extraParams?.get(this.KEY_FEE_ESTIMATE));
    const fee: Fee = Fee.fromData(halfBakedFee as Fee.Data);
    const ulunaFee = fee.amount.get('uluna');
    const msgs = [new MsgSend(this.address, to, { uluna: amount * 1_000_000 - ulunaFee!.amount.toNumber() })];
    const tx = new Tx(new TxBody(msgs, memo || '', 0), new AuthInfo([], fee), []);
    this.utilityLogger.debug(`Luna: Signing tx: ${JSON.stringify(tx.toProto(), null, 2)}`);

    const key = new RawKey(Buffer.from(this.privateKey!.replace('0x', ''), 'hex'));
    const signedTx = await key.signTx(tx, {
      signMode: SignMode.SIGN_MODE_DIRECT,
      sequence: extraParams?.get(this.KEY_SEQUENCE),
      chainID: extraParams?.get(this.KEY_CHAIN_ID),
      accountNumber: extraParams?.get(this.KEY_ACCOUNT_NUMBER),
    });

    return {
      tx: SuperJSON.stringify(signedTx),
    };
  }
}
