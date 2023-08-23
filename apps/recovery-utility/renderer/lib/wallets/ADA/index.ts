import { Cardano as BaseCardano } from '@fireblocks/wallet-derivation';
import {
  Address,
  BigNum,
  Ed25519Signature,
  LinearFee,
  PublicKey,
  Transaction,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionHash,
  TransactionInput,
  TransactionOutput,
  TransactionWitnessSet,
  Value,
  Vkey,
  Vkeywitness,
  Vkeywitnesses,
} from '@emurgo/cardano-serialization-lib-asmjs';

import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import blake2b from 'blake2b';

export class Cardano extends BaseCardano implements SigningWallet {
  public async generateTx({ utxos, to, amount }: GenerateTxInput): Promise<TxPayload> {
    if (!utxos || utxos.length === 0) {
      throw Error('No UTXOs selected or exist');
    }
    const linearFee = LinearFee.new(BigNum.from_str('44'), BigNum.from_str('155381'));
    const txBuilderConfig = TransactionBuilderConfigBuilder.new()
      .fee_algo(linearFee)
      .pool_deposit(BigNum.from_str('500000000'))
      .key_deposit(BigNum.from_str('2000000'))
      .max_value_size(4000)
      .max_tx_size(8000)
      .coins_per_utxo_word(BigNum.from_str('34482'))
      .build();
    const txBuilder = TransactionBuilder.new(txBuilderConfig);
    let totalSum = 0;
    let fee = 0;
    for (let i = 0; i < utxos.length; i += 1) {
      const utxo = utxos[i];
      txBuilder.add_input(
        Address.from_bech32(this.address),
        TransactionInput.new(TransactionHash.from_hex(utxo.hash), utxo.index),
        Value.new(BigNum.from_str(utxo.value.toString())),
      );
      totalSum += utxo.value;
      fee += parseInt(
        txBuilder
          .fee_for_input(
            Address.from_bech32(this.address),
            TransactionInput.new(TransactionHash.from_hex(utxo.hash), utxo.index),
            Value.new(BigNum.from_str(utxo.value.toString())),
          )
          .to_js_value(),
      );
    }
    const output = TransactionOutput.new(Address.from_bech32(to), Value.new(BigNum.from_str(totalSum.toString())));
    fee += parseInt(txBuilder.fee_for_output(output).to_js_value());
    fee += parseInt(txBuilder.min_fee().to_js_value());
    txBuilder.add_output(TransactionOutput.new(Address.from_bech32(to), Value.new(BigNum.from_str((totalSum - fee).toString()))));
    txBuilder.add_change_if_needed(Address.from_bech32(this.address));
    const txBody = txBuilder.build();

    this.utilityLogger.debug(`Cardano: Signing tx: ${JSON.stringify(txBody.to_json(), null, 2)}`);

    const sigHex = Buffer.from(await this.sign(blake2b(32).update(txBody.to_bytes()).digest())).toString('hex');
    const sig = Ed25519Signature.from_hex(sigHex);
    const publicKey = PublicKey.from_hex(this.publicKey.replace('0x', ''));

    const vkey = Vkey.new(publicKey);
    const witness = Vkeywitness.new(vkey, sig);

    const witnesses = TransactionWitnessSet.new();
    const vkeyWitnesses = Vkeywitnesses.new();
    vkeyWitnesses.add(witness);
    witnesses.set_vkeys(vkeyWitnesses);

    const signedTx = Transaction.new(txBody, witnesses);

    return {
      tx: signedTx.to_hex(),
    };
  }
}
