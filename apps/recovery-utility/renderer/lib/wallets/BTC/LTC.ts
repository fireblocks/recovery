import { LiteCoin as BaseLTC } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { BTCUtilitySigner } from './BTCUtilitySigner';
import { GenerateTxInput, TxPayload } from '../types';

export class LiteCoin extends BaseLTC implements SigningWallet {
  public async generateTx(input: GenerateTxInput): Promise<TxPayload> {
    throw new Error('Not implemented');
  }
}