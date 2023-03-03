import { encodeBase58 } from "ethers";
import { Input, AddressInput } from "../../types";
import { EdDSAWallet } from "../EdDSAWallet";

export class Solana extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 501);
  }

  getAddress({ publicKey }: AddressInput) {
    return encodeBase58(publicKey);
  }
}
