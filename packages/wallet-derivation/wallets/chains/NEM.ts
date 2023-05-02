import { keccak_256 } from '@noble/hashes/sha3';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { base32Encode } from '@polkadot/util-crypto';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class NEM extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 43);
  }

  protected getAddress(): string {
    // https://github.com/QuantumMechanics/NEM-sdk/blob/master/src/model/address.js#L83
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Encode a string to base32
     *
     * @param {string} s - A string
     *
     * @return {string} - The encoded string
     */
    let b32encode = function (s: string) {
      let parts = [];
      let quanta = Math.floor(s.length / 5);
      let leftover = s.length % 5;

      if (leftover != 0) {
        for (let i = 0; i < 5 - leftover; i++) {
          s += '\x00';
        }
        quanta += 1;
      }

      for (let i = 0; i < quanta; i++) {
        parts.push(alphabet.charAt(s.charCodeAt(i * 5) >> 3));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5) & 0x07) << 2) | (s.charCodeAt(i * 5 + 1) >> 6)));
        parts.push(alphabet.charAt((s.charCodeAt(i * 5 + 1) & 0x3f) >> 1));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x01) << 4) | (s.charCodeAt(i * 5 + 2) >> 4)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 2) & 0x0f) << 1) | (s.charCodeAt(i * 5 + 3) >> 7)));
        parts.push(alphabet.charAt((s.charCodeAt(i * 5 + 3) & 0x7f) >> 2));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x03) << 3) | (s.charCodeAt(i * 5 + 4) >> 5)));
        parts.push(alphabet.charAt(s.charCodeAt(i * 5 + 4) & 0x1f));
      }

      let replace = 0;
      if (leftover == 1) replace = 6;
      else if (leftover == 2) replace = 4;
      else if (leftover == 3) replace = 3;
      else if (leftover == 4) replace = 1;

      for (let i = 0; i < replace; i++) parts.pop();
      for (let i = 0; i < replace; i++) parts.push('=');

      return parts.join('');
    };

    let hex2a = function (hexx: string) {
      let hex = hexx.toString();
      let str = '';
      for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      return str;
    };

    const binPubKey = Buffer.from(this.publicKey.replace('0x', ''), 'hex');
    const hash = ripemd160(keccak_256(binPubKey));

    const prefix = this.isTestnet ? '98' : '68';
    const versionPrefixedHash = prefix + Buffer.from(hash).toString('hex');

    const checksum = Buffer.from(keccak_256(Buffer.from(versionPrefixedHash, 'hex')))
      .toString('hex')
      .substring(0, 8);
    const fullAddrValue = versionPrefixedHash + checksum;

    return b32encode(hex2a(fullAddrValue));
  }
}
