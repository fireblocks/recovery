import { Buffer } from "buffer";
import { p2pkh } from "bitcoinjs-lib/src/payments/p2pkh";
import { p2wpkh } from "bitcoinjs-lib/src/payments/p2wpkh";
import { ECDSAWallet } from "../ECDSAWallet";
import { Input, AddressInput } from "../../types";

export class Bitcoin extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 0);
  }

  getAddress({ publicKey }: AddressInput) {
    const publicKeyBuffer = Buffer.from(publicKey.slice(2), "hex");

    const method = this.input.isLegacy ? p2pkh : p2wpkh;

    let { address = "" } = method({ pubkey: publicKeyBuffer });

    if (this.input.isTestnet) {
      address = address.replace(/^bc/, "tb");
    }

    return address;
  }
}
