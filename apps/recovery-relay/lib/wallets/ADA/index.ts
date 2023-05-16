import { Cardano as BaseCardano, Input } from '@fireblocks/wallet-derivation';
import { ApolloClient, InMemoryCache, NormalizedCacheObject, gql } from '@apollo/client';
import {
  Address,
  BigNum,
  Ed25519Signature,
  LinearFee,
  PublicKey,
  Transaction,
  TransactionBody,
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
import { AccountData, TxInput, TxPayload, RawSignature } from '../types';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';
import { BlockFrostAPI } from './BlockfrostAPI';

interface ADAGQLUtxo {
  address: string;
  transaction: {
    block: {
      number: number;
    };
  };
  token: {
    asset: {
      name: string;
      ticker: string;
    };
    quantity: number;
  };
  txHash: string;
  index: number;
  value: number;
}

interface SubmittedTx {
  submitTransaction: {
    hash: string;
  };
}

export class Cardano extends BaseCardano implements LateInitConnectedWallet {
  private gqlClient: ApolloClient<NormalizedCacheObject> | undefined = undefined;

  private bkfClient: BlockFrostAPI | undefined = undefined;

  constructor(input: Input) {
    super(input);
    this.isLateInit = () => true;
  }

  public updateDataEndpoint(endpoint: string): void {
    if (endpoint.startsWith('http')) {
      this.gqlClient = new ApolloClient({
        uri: endpoint,
        cache: new InMemoryCache(),
      });
    } else {
      this.bkfClient = new BlockFrostAPI(endpoint, this.isTestnet);
    }
  }

  public async getBalance(): Promise<number> {
    return (await this.prepare()).balance;
  }

  public async prepare(): Promise<AccountData> {
    let balance: number = 0;
    const utxos: TxInput[] = [];
    if (this.gqlClient) {
      const utxosResult = (
        await this.gqlClient.query<{ utxos: ADAGQLUtxo[] }>({
          query: gql`
            query utxoSetForAddresses($addresses: [String]!) {
              utxos(where: { address: { _in: $addresses } }) {
                address
                transaction {
                  block {
                    number
                  }
                }
                tokens {
                  asset {
                    name
                    ticker
                  }
                  quantity
                }
                txHash
                index
                value
              }
            }
          `,
        })
      ).data.utxos;
      utxosResult.forEach((utxo: ADAGQLUtxo) => {
        balance += utxo.transaction.block.number ? utxo.value : 0;
        utxos.push({
          hash: utxo.txHash,
          index: utxo.index,
          value: utxo.value,
          confirmed: !!utxo.transaction.block,
        });
      });
    } else if (this.bkfClient) {
      const bkfUTXOs = await this.bkfClient.getUtxos(this.address);
      bkfUTXOs.forEach((utxo) => {
        const lovelaceAmount = utxo.amount.filter((amount) => amount.unit === 'lovelace');
        const value = lovelaceAmount.length > 0 ? parseInt(lovelaceAmount[0].quantity, 10) : 0;
        balance += value;
        utxos.push({
          hash: utxo.tx_hash,
          index: utxo.output_index,
          value,
          confirmed: !!utxo.block,
        });
      });
    } else {
      throw Error('Endpoint not initialized yet');
    }
    return {
      utxos,
      balance,
    };
  }

  public async generateTx(
    to: string,
    amount: number,
    memo?: string | undefined,
    utxos?: TxInput[] | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    additionalParameters?: Map<string, object> | undefined,
  ): Promise<TxPayload> {
    if (!utxos || utxos.length === 0) {
      throw Error('No UTXOs selected or exist');
    }
    const txBuilderConfig = TransactionBuilderConfigBuilder.new()
      .fee_algo(LinearFee.new(BigNum.from_str('44'), BigNum.from_str('155381')))
      .build();
    const txBuilder = TransactionBuilder.new(txBuilderConfig);

    for (let i = 0; i < utxos.length; i += 1) {
      const utxo = utxos[i];
      txBuilder.add_input(
        Address.from_bech32(this.address),
        TransactionInput.new(TransactionHash.from_hex(utxo.hash), utxo.index),
        Value.new(BigNum.from_str(utxo.value!.toString())),
      );
    }

    txBuilder.add_output(TransactionOutput.new(Address.from_bech32(to), Value.new(BigNum.from_str(amount.toString()))));
    txBuilder.add_change_if_needed(Address.from_bech32(this.address));
    const txBody = txBuilder.build();
    return {
      tx: txBody.to_hex(),
      derivationPath: [44, this.path.coinType, this.path.account, this.path.changeIndex, this.path.changeIndex],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async broadcastTx(txHex: string, sigs: RawSignature[], customUrl?: string | undefined): Promise<string> {
    const txBody = TransactionBody.from_hex(txHex);
    const witnesses = TransactionWitnessSet.new();

    sigs.forEach((sig: RawSignature) => {
      const signature = Ed25519Signature.from_hex(`0x${sig.r.replace('0x', '')}${sig.s.replace('0x', '')}`);
      const publicKey = PublicKey.from_hex(this.publicKey);

      const vkey = Vkey.new(publicKey);
      const witness = Vkeywitness.new(vkey, signature);

      const vkeyWitnesses = Vkeywitnesses.new();
      vkeyWitnesses.add(witness);
      witnesses.set_vkeys(vkeyWitnesses);
    });

    const signedTx = Transaction.new(txBody, witnesses);
    let signedTxHash;
    if (this.gqlClient) {
      signedTxHash = (
        (
          await this.gqlClient.query({
            query: gql`
              mutation SendRawTx($rawtx: String!) {
                submitTransaction(transaction: $rawtx) {
                  hash
                }
              }
            `,
            variables: { rawtx: signedTx.to_hex },
          })
        ).data as SubmittedTx
      ).submitTransaction.hash;
    } else if (this.bkfClient) {
      signedTxHash = await this.bkfClient.txSubmit(Buffer.from(signedTx.to_bytes()));
    } else {
      throw Error('Endpoint not initialized yet.');
    }
    return signedTxHash;
  }
}
