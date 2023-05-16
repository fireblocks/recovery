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
    this.restURL = input.isTestnet ? 'https://cosmos-testnet-rpc.allthatnode.com:1317/' : 'https://cosmos-rpc.quickapi.com/';
    this.rpcURL = input.isTestnet ? 'https://cosmos-testnet-rpc.allthatnode.com:26657' : 'https://cosmos-lcd.quickapi.com/';
  }

  public async prepare(): Promise<AccountData> {
    await this.prepareClients();
    const balanceCoin = await this.stargateClient!.getBalance(this.address, 'uatom');
    const { accountNumber, sequence } = await this.stargateClient!.getSequence(this.address);
    const chainId = await this.stargateClient!.getChainId();
    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_ACCOUNT_NUMBER, accountNumber);
    extraParams.set(this.KEY_CHAIN_ID, chainId);
    extraParams.set(this.KEY_SEQUENCE, sequence);
    // TODO: Add option for cusom fee
    return { balance: parseInt(balanceCoin.amount, 10) / 1_000_000, extraParams };
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
