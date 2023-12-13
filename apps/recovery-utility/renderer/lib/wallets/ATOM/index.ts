import { Cosmos as BaseCosmos } from '@fireblocks/wallet-derivation';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import {
  encodePubkey,
  Registry,
  makeAuthInfoBytes,
  makeSignDoc,
  DirectSecp256k1Wallet,
  GeneratedType,
} from '@cosmjs/proto-signing';
import { Int53 } from '@cosmjs/math';
import { fromBase64 } from '@cosmjs/encoding';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class Cosmos extends BaseCosmos implements SigningWallet {
  public async generateTx({ to, amount, extraParams, memo }: GenerateTxInput): Promise<TxPayload> {
    const wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(this.privateKey!.replace('0x', ''), 'hex'));
    const sendMsg = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: this.address,
        toAddress: to,
        amount: [
          {
            amount: `${amount * 1_000_000}`,
            denom: 'uatom',
          },
        ],
      },
    };

    const fee = extraParams?.get(this.KEY_FEE) ?? {
      amount: [
        {
          denom: 'uatom',
          amount: '2000',
        },
      ],
      gas: '200000',
    };

    const accountNumber = extraParams?.get(this.KEY_ACCOUNT_NUMBER);
    const sequence = extraParams?.get(this.KEY_SEQUENCE);
    const chainId = extraParams?.get(this.KEY_CHAIN_ID);

    // Same as SigningStargateClient.signDirect
    const registry = new Registry(defaultRegistryTypes as Iterable<[string, GeneratedType]>);
    const pubKey: any = encodePubkey(encodeSecp256k1Pubkey(Buffer.from(this.publicKey.replace('0x', ''), 'hex')));
    const txEncoded = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: [sendMsg],
        memo,
      },
    };

    this.utilityLogger.logSigningTx('Cosmos', txEncoded);

    const txBodyBytes = registry.encode(txEncoded);
    const gasLimit = Int53.fromString(fee.gas).toNumber();
    const authInfoBytes = makeAuthInfoBytes([{ pubkey: pubKey, sequence }], fee.amount, gasLimit, undefined, undefined);
    const signDoc: SignDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
    const signedTx = await wallet.signDirect(this.address, signDoc);
    const txRaw = TxRaw.fromPartial({
      bodyBytes: signedTx.signed.bodyBytes,
      authInfoBytes: signedTx.signed.authInfoBytes,
      signatures: [fromBase64(signedTx.signature.signature)],
    });

    const tx = Buffer.from(TxRaw.encode(txRaw).finish()).toString('hex');
    return {
      tx,
    };
  }
}
