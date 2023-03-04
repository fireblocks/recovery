import { Input, AddressInput } from "../../types";
import { ECDSAWallet } from "../ECDSAWallet";

export class Ethereum extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 60);
  }

  getAddress({ evmAddress }: AddressInput) {
    return evmAddress as string;
  }
}
