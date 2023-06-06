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
import { AccountData, StdUTXO } from '../types';
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

  private endpoint: string | undefined = undefined;

  constructor(input: Input) {
    super(input);
    this.isLateInit = () => true;
  }

  public getLateInitLabel(): string {
    return 'Blockfrost Project ID or GraphQL Url';
  }

  public updateDataEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
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
    const utxos: StdUTXO[] = [];
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
      balance: balance / 1_000_000,
      endpoint: this.endpoint,
      insufficientBalance: balance / 1_000_000 < 0.001,
    };
  }

  public async broadcastTx(txHex: string): Promise<string> {
    const signedTx = Transaction.from_hex(txHex);
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
    return signedTxHash.replace('"', '');
  }
}
