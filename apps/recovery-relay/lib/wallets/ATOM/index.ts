import { Cosmos as BaseCosmos, BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { StargateClient, defaultRegistryTypes } from '@cosmjs/stargate';
import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { encodePubkey, Registry, makeAuthInfoBytes, makeSignDoc } from '@cosmjs/proto-signing';
import { Int53 } from '@cosmjs/math';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { AccountData, RawSignature, TxPayload, UTXO } from '../types';

export class Cosmos extends BaseCosmos implements BaseWallet {
  private tendermintClient: Tendermint34Client | undefined;

  private stargateClient: StargateClient | undefined;

  private restURL: string;

  private rpcURL: string;

  constructor(input: Input) {
    super(input);

    this.tendermintClient = undefined;
    this.restURL = input.isTestnet
      ? 'https://cosmos-testnet-rpc.allthatnode.com:1317/'
      : 'https://cosmos-mainnet-rpc.allthatnode.com:1317';
    this.rpcURL = input.isTestnet
      ? 'https://cosmos-testnet-rpc.allthatnode.com:26657'
      : 'https://cosmos-mainnet-rpc.allthatnode.com:26657';
  }

  public async prepare(): Promise<AccountData> {
    await this.prepareClients();
    const balanceCoin = await this.stargateClient!.getBalance(this.address, 'uatom');
    return { balance: parseInt(balanceCoin.amount, 10) / 1_000_000 };
  }

  public async generateTx(
    to: string,
    amount: number,
    memo?: string,
    utxos?: UTXO[],
    additionalParameters?: Map<string, object>,
  ): Promise<TxPayload> {
    let fee: { gas: string; amount: { amount: string; denom: string }[] };
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
    if (additionalParameters?.get('fee')) {
      fee = additionalParameters.get('fee') as { gas: string; amount: { amount: string; denom: string }[] };
    } else {
      fee = {
        amount: [
          {
            denom: 'uatom',
            amount: '2000',
          },
        ],
        gas: '200000',
      };
    }

    // TODO: This needs to be on the relay side when moving signing and building to util side.
    const { accountNumber, sequence } = await this.stargateClient!.getSequence(this.address);
    const chainId = await this.stargateClient!.getChainId();

    // Same as SigningStargateClient.signDirect
    const registry = new Registry(defaultRegistryTypes);
    const pubKey: any = encodePubkey(encodeSecp256k1Pubkey(Buffer.from(this.publicKey, 'hex')));
    const txEncoded = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: [sendMsg],
        memo,
      },
    };
    const txBodyBytes = registry.encode(txEncoded);
    const gasLimit = Int53.fromString(fee.gas).toNumber();
    const authInfoBytes = makeAuthInfoBytes([{ pubkey: pubKey, sequence }], fee.amount, gasLimit, undefined, undefined);
    const signDoc: SignDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
    const tx = Buffer.from(JSON.stringify(SignDoc.toJSON(signDoc))).toString('hex');
    // TODO: Signature process has extra steps required on util side, need to reconstruct back to signdoc and sign using direct wallet DirectSecp256k1Wallet
    return {
      tx,
      derivationPath: this.pathParts,
    };
  }

  public async broadcastTx(txHex: string, sigs: RawSignature[]): Promise<string> {
    await this.prepareClients();

    const sig = sigs[0];
    const signature: string = `${sig.r}${sig.s}`;
    const signDoc: SignDoc = SignDoc.fromJSON(JSON.parse(Buffer.from(txHex, 'hex').toString()));
    // Continuation of SigningStargateClient.signDirect from after "this.sign...."
    const txRaw: TxRaw = TxRaw.fromPartial({
      bodyBytes: signDoc.bodyBytes,
      authInfoBytes: signDoc.authInfoBytes,
      signatures: [Buffer.from(signature, 'hex')],
    });

    const { transactionHash } = await this.stargateClient!.broadcastTx(TxRaw.encode(txRaw).finish());
    return transactionHash;
  }

  private async prepareClients(): Promise<void> {
    if (!this.tendermintClient || !this.stargateClient) {
      this.tendermintClient = await Tendermint34Client.connect(this.rpcURL);
      this.stargateClient = await StargateClient.connect(this.rpcURL);
    }
  }
}
