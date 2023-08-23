import { NEM as BaseNEM } from '@fireblocks/wallet-derivation';
import { keccak_512 } from '@noble/hashes/sha3';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class NEM extends BaseNEM implements SigningWallet {
  public async generateTx({ to, amount, memo }: GenerateTxInput): Promise<TxPayload> {
    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/utils/convert.js#L28
    const hex2ua = (x: string) => {
      let hex = x.toString(); //force conversion
      let ua = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        ua[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      return ua;
    };

    const ua2hex = (x: Uint8Array) => {
      const _hexEncodeArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
      let s = '';
      for (let i = 0; i < x.length; i++) {
        let code = x[i];
        s += _hexEncodeArray[code >>> 4];
        s += _hexEncodeArray[code & 0x0f];
      }
      return s;
    };

    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/model/objects/miscellaneous.js#L25
    const common = {
      privateKey: this.privateKey?.replace('0x', ''),
    };

    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/model/objects/transactions.js#L10
    const transferTransaction = {
      amount: amount * 10 ** 6,
      message: memo || '',
      recipient: to || '',
      recipientPublicKey: '',
      isMultisig: false,
      multisigAccount: '',
      messageType: 1,
      mosaics: [],
    };

    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/model/transactions/transferTransaction.js#L19
    const sender = this.publicKey.replace('0x', '');
    const recipientCompressedKey = to;

    const txAmount = Math.round(transferTransaction.amount);
    const message = {
      type: 1,
      payload: Buffer.from(transferTransaction.message).toString('hex'),
    };

    const messageFee = message.payload.length > 0 ? 0.05 * (Math.floor(message.payload.length / 2 / 32) + 1) : 0.0;
    const due = this.isTestnet ? 60 : 600;

    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/model/transactions/transferTransaction.js#L80
    const NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
    const nemTimestamp = Math.floor(Date.now() / 1000 - NEM_EPOCH / 1000);
    const version = this.isTestnet ? 0x98000000 | 1 : 0x68000000 | 1;
    const txCommonPart = {
      type: 0x101,
      version,
      signer: this.publicKey.replace('0x', ''),
      timeStamp: nemTimestamp,
      deadline: nemTimestamp + 600,
    };
    const minFee = Math.floor(Math.max(1, amount / 1000000 / 10000));
    const fee = 0.05 * (minFee > 25 ? 25 : minFee);
    const totalFee = Math.floor((messageFee + fee) * 10 ** 6);
    const customPart = {
      recipient: recipientCompressedKey.toUpperCase().replace(/-/g, ''),
      amount: amount * 10 ** 6 - totalFee,
      fee: totalFee,
      message: message,
      mosaics: null,
    };

    const extendObj = function () {
      for (var i = 1; i < arguments.length; i++) {
        for (var key in arguments[i]) {
          if (arguments[i].hasOwnProperty(key)) {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
      return arguments[0];
    };

    //@ts-ignore
    const entity = extendObj(txCommonPart, customPart);

    this.utilityLogger.debug(`NEM: Signing tx: ${JSON.stringify(entity, null, 2)}`);

    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/model/transactions/send.js#L16
    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/utils/serialization.js#L255
    const r = new ArrayBuffer(512 + 2764);
    const d = new Uint32Array(r);
    const b = new Uint8Array(r);
    d[0] = entity['type'];
    d[1] = entity['version'];
    d[2] = entity['timeStamp'];
    let temp = hex2ua(entity['signer']);
    d[3] = temp.length;
    var e = 16;
    for (var j = 0; j < temp.length; ++j) {
      b[e++] = temp[j];
    }

    // Transaction
    var i = e / 4;
    d[i++] = entity['fee'];
    d[i++] = Math.floor(entity['fee'] / 0x100000000);
    d[i++] = entity['deadline'];
    e += 12;
    d[i++] = entity['recipient'].length;
    e += 4;
    // TODO: check that entity['recipient'].length is always 40 bytes
    for (var j = 0; j < entity['recipient'].length; ++j) {
      b[e++] = entity['recipient'].charCodeAt(j);
    }
    i = e / 4;
    d[i++] = entity['amount'];
    d[i++] = Math.floor(entity['amount'] / 0x100000000);
    e += 8;

    if (entity['message']['type'] === 1 || entity['message']['type'] === 2) {
      temp = hex2ua(entity['message']['payload']);
      if (temp.length === 0) {
        d[i++] = 0;
        e += 4;
      } else {
        // length of a message object
        d[i++] = 8 + temp.length;
        // object itself
        d[i++] = entity['message']['type'];
        d[i++] = temp.length;
        e += 12;
        for (var j = 0; j < temp.length; ++j) {
          b[e++] = temp[j];
        }
      }
    }

    const serializedTx = new Uint8Array(r, 0, e);
    const sigData = await this.sign(serializedTx, async (...msgs: Uint8Array[]) => keccak_512(Buffer.concat(msgs)));

    const fullTx = {
      data: ua2hex(serializedTx),
      signature: Buffer.from(sigData).toString('hex'),
    };

    return {
      tx: Buffer.from(JSON.stringify(fullTx)).toString('hex'),
    };
  }
}
