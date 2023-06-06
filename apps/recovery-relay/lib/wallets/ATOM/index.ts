import { Cosmos as BaseCosmos, Input } from '@fireblocks/wallet-derivation';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { StargateClient } from '@cosmjs/stargate';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { AccountData, RawSignature } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class Cosmos extends BaseCosmos implements ConnectedWallet {
  private tendermintClient: Tendermint34Client | undefined;

  private stargateClient: StargateClient | undefined;

  private rpcURL: string;

  constructor(input: Input) {
    super(input);

    this.tendermintClient = undefined;
    this.rpcURL = input.isTestnet ? 'https://cosmos-testnet-rpc.allthatnode.com:26657' : 'https://cosmos-lcd.quickapi.com/';
  }

  public async getBalance(): Promise<number> {
    const balanceCoin = await this.stargateClient!.getBalance(this.address, 'uatom');
    return parseInt(balanceCoin.amount, 10) / 1_000_000;
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
    const balance = parseInt(balanceCoin.amount, 10) / 1_000_000;
    return { balance, extraParams, insufficientBalance: balance < 0.001 };
  }

  public async broadcastTx(txHex: string): Promise<string> {
    await this.prepareClients();

    // TODO: Serialize tx with signature
    // const sig = sigs[0];
    // const signature: string = `${sig.r}${sig.s}`;
    const signDoc: SignDoc = SignDoc.fromJSON(JSON.parse(Buffer.from(txHex, 'hex').toString()));
    // Continuation of SigningStargateClient.signDirect from after "this.sign...."
    const txRaw: TxRaw = TxRaw.fromPartial({
      bodyBytes: signDoc.bodyBytes,
      authInfoBytes: signDoc.authInfoBytes,
      // signatures: [Buffer.from(signature, 'hex')],
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
