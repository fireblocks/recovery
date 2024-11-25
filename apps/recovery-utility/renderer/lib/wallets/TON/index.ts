import { Ton as BaseTon, Input } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { GenerateTxInput, TxPayload } from '../types';

export class Ton extends BaseTon implements SigningWallet {
  constructor(input: Input) {
    super(input);
  }

  public async generateTx({ to, amount, feeRate, memo, extraParams }: GenerateTxInput): Promise<TxPayload> {
    // calculate the amount to withdraw
    const fee = BigInt(toNano(feeRate!)); // feeRate as BigInt in nano
    const amountToWithdraw = BigInt(toNano(amount)) - fee; // amount is the wallet balance
    let internalMessageMemo = undefined;
    if (memo) {
      internalMessageMemo = beginCell().storeUint(0, 32).storeStringTail(memo).endCell();
    }
    // create the tx payload
    let internalMessage = beginCell()
      .storeUint(0x10, 6) // 0x10 is no bounce
      .storeAddress(Address.parse(to)) // Store the recipient address
      .storeCoins(amountToWithdraw); // Store the amount within the payload

    if (internalMessageMemo) {
      internalMessage
        .storeUint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1) // store memo as reference
        .storeRef(internalMessageMemo)
        .endCell();
    } else {
      internalMessage.storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1).endCell(); // no memo added
    }

    let toSign = beginCell()
      .storeUint(698983191, 32) // sub wallet_id
      .storeUint(Math.floor(Date.now() / 1e3) + 600, 32) // Transaction expiration time, +600 = 10 minute
      .storeUint(extraParams?.get('seqno'), 32) // store seqno
      .storeUint(0, 8)
      .storeUint(128, 8) // store SendMode as CARRY_ALL_REMAINING_BALANCE
      .storeRef(internalMessage) // store our internalMessage as a reference
      .endCell();

    const signMessage = toSign.toBoc().toString('base64');
    const signData = toSign.hash();

    const signature = Buffer.from(await this.sign(Uint8Array.from(signData))).toString('base64');
    const unsignedTx = Cell.fromBase64(signMessage).asBuilder();

    const body = beginCell().storeBuffer(Buffer.from(signature, 'base64')).storeBuilder(unsignedTx).endCell();
    return { tx: body.toBoc().toString('base64') };
  }
}
