import { Buffer } from "buffer";
import { p2pkh } from "bitcoinjs-lib/src/payments/p2pkh";
import { p2wpkh } from "bitcoinjs-lib/src/payments/p2wpkh";
import { ECDSAWallet } from "../ECDSAWallet";
import { Input, AddressInput } from "../../types";

export class Bitcoin extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 0);
  }

  getAddress({ publicKey, isTestnet, isLegacy }: AddressInput) {
    const publicKeyBuffer = Buffer.from(publicKey.slice(2), "hex");

    const method = isLegacy ? p2pkh : p2wpkh;

    const payment = method({ pubkey: publicKeyBuffer });

    let address = payment.address ?? "";

    if (isTestnet) {
      address = address.replace(/^bc/, "tb");
    }

    return address;
  }
}
