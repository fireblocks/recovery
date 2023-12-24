import { BitcoinSV as BaseBitcoinSV } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import { BTCUtilitySigner } from './BTCUtilitySigner';

export class BitcoinSV extends BaseBitcoinSV implements SigningWallet {
  public generateTx(input: GenerateTxInput): Promise<TxPayload> {
    throw new Error('Not implemented');
  }
}
