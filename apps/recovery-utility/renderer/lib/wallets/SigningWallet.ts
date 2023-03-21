import { BaseWallet as DerivationBaseWallet } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from './types';

export abstract class SigningWallet extends DerivationBaseWallet {
  public abstract generateTx(input: GenerateTxInput): Promise<TxPayload>;
}
