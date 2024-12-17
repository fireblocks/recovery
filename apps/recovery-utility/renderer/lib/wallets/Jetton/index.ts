import { Ton as BaseTon, Input } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { Address, beginCell, Cell, SendMode } from '@ton/core';
import { GenerateTxInput, TxPayload } from '../types';

export class Jetton extends BaseTon implements SigningWallet {
  constructor(input: Input) {
    super(input);
  }

  public async generateTx({ to, amount, feeRate, memo, extraParams }: GenerateTxInput): Promise<TxPayload> {
    // check for jetton extra params (contract address, seqno and decimals)
    if (!extraParams?.get('contract-address') || !extraParams?.get('decimals') || !extraParams?.get('seqno')) {
      throw new Error('Jetton: Missing jetton parameters');
    }

    const jettonTransferOpcode = 0x0f8a7ea5;
    const decimals = extraParams?.get('decimals');
    const normalizingFactor = 10 ** decimals;
    const amountToWithdraw = amount * normalizingFactor; // amount is the wallet balance

    let internalMessageMemo = undefined;
    // create the tx payload
    const internalMessageBody = beginCell()
      .storeUint(jettonTransferOpcode, 32) // opcode for jetton transfer
      .storeUint(0, 64) // query id
      .storeCoins(amountToWithdraw) // jetton balance
      .storeAddress(Address.parse(to)) // tx destination
      .storeAddress(Address.parse(this.address)) // excess fees sent back to native ton wallet
      .storeBit(0); // no custom payload
    if (memo) {
      internalMessageMemo = beginCell().storeUint(0, 32).storeStringTail(memo).endCell();
      internalMessageBody
        .storeCoins(1) // forward amount - if >0, will send notification message
        .storeBit(1) // we store forwardPayload as a reference
        .storeRef(internalMessageMemo)
        .endCell();
    } else {
      internalMessageBody
        .storeCoins(0) // no memo added
        .storeBit(0)
        .endCell();
    }
    const sendMode = SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS;

    const contractAddress = extraParams?.get('contract-address');
    const internalMessage = beginCell()
      .storeUint(0x18, 6) // bounceable tx
      .storeAddress(Address.parse(contractAddress)) //wallet Jetton contract address
      .storeCoins(BigInt(feeRate!))
      .storeUint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1) // We store 1 that means we have body as a reference
      .storeRef(internalMessageBody)
      .endCell();
    const toSign = beginCell()
      .storeUint(698983191, 32) // Subwallet ID -> https://docs.ton.org/v3/guidelines/smart-contracts/howto/wallet#subwallet-ids
      .storeUint(Math.floor(Date.now() / 1e3) + 600, 32) // Transaction expiration time, +600 = 10 minute
      .storeUint(extraParams?.get('seqno'), 32) // store seqno
      .storeUint(0, 8)
      .storeUint(sendMode, 8)
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
