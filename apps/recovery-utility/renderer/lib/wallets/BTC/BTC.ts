import { Bitcoin as BaseBitcoin } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { BTCUtilitySigner } from './BTCUtilitySigner';
import { GenerateTxInput, TxPayload } from '../types';

export class Bitcoin extends BaseBitcoin implements SigningWallet {
  public async generateTx(input: GenerateTxInput): Promise<TxPayload> {
    return BTCUtilitySigner.prototype.generateTx.bind(this)(input);
  }
}
