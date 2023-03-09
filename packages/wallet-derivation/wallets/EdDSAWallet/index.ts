import { Buffer } from "buffer";
import { toBigIntBE } from "bigint-buffer";
import { decode } from "bs58check";
import { createHmac } from "crypto";
import { hexlify, toBeHex } from "ethers";
import { Input, Derivation as KeyDerivation } from "../../types";
import { BaseWallet } from "../BaseWallet";
import {
  hexToNumber,
  numberToBytesLE,
  numberToBytesBE,
  numberTo4BytesBE,
  randomBytes,
  concatBytes,
  _0n,
} from "./bytes";
import {
  sha512,
  mod,
  modlLE,
  scalarMult,
  serialize,
  decodePoint,
  edwards,
  G,
  CURVE,
} from "./ed25519";

export abstract class EdDSAWallet extends BaseWallet {
  constructor(input: Input, defaultCoinType: number) {
    super(input, defaultCoinType, "EDDSA");
  }

  private static hashForDerive(
    pubKey: readonly [bigint, bigint],
    chainCode: Uint8Array,
    idx: number
  ) {
    const hmac = createHmac("sha512", chainCode);
    hmac.update(serialize(pubKey));
    hmac.update(Buffer.from([0x0]));
    hmac.update(numberTo4BytesBE(idx));
    return hmac.digest();
  }

  private static deriveNextKeyLevel(
    pubKey: readonly [bigint, bigint],
    prvKey: bigint,
    chainCode: Uint8Array,
    idx: number
  ): [readonly [bigint, bigint], bigint, Uint8Array] {
    const hash = EdDSAWallet.hashForDerive(pubKey, chainCode, idx);
    const derivedChainCode = hash.subarray(32);
    const exp = toBigIntBE(hash.subarray(undefined, 32));
    const tmpPoint = scalarMult(G, exp);
    const derivedPubKey = edwards(pubKey, tmpPoint);
    const derivedPrvKey = (prvKey + exp) % CURVE.l;
    return [derivedPubKey, derivedPrvKey, derivedChainCode];
  }

  /**
   * Derive an address from an fprv
   * @param extendedKey The fprv/fpub to derive from
   * @param derivationPath The derivation path to use
   */
  protected derive(extendedKey: string): KeyDerivation {
    const decodedKey = decode(extendedKey);

    if (decodedKey.length !== 78) {
      throw new Error("Extended key is not a valid FPRV or FPUB");
    }

    const prefix = extendedKey.slice(0, 4);

    let isPrivate = false;

    if (prefix === "fprv") {
      isPrivate = true;
    } else if (prefix !== "fpub") {
      throw new Error("Extended key is not a valid fprv or fpub");
    }

    let chainCode = decodedKey.subarray(13, 45);
    let prvKey: bigint | undefined =
      toBigIntBE(Buffer.from(decodedKey.subarray(46))) ?? undefined;
    let pubKey: readonly [bigint, bigint];

    if (isPrivate) {
      pubKey = scalarMult(G, prvKey);
    } else {
      pubKey = decodePoint(numberToBytesBE(prvKey));
      prvKey = _0n;
    }

    [pubKey, prvKey, chainCode] = this.pathParts.reduce(
      ([_pubKey, _prvKey, _chainCode], pathPart) =>
        EdDSAWallet.deriveNextKeyLevel(_pubKey, _prvKey, _chainCode, pathPart),
      [pubKey, prvKey, chainCode]
    );

    if (!isPrivate) {
      prvKey = undefined;
    }

    const publicKey = hexlify(serialize(pubKey));
    const privateKey = prvKey ? toBeHex(prvKey) : undefined;

    return { publicKey, privateKey };
  }

  /**
   * Generate a Fireblocks EdDSA signature for a given message and private key.
   *
   * @param message string or byte array to sign
   * @param privateKey hex-encoded private key
   * @returns Fireblocks EdDSA signature
   */
  protected async sign(message: string | Uint8Array) {
    if (!this.privateKey) {
      throw new Error("Cannot sign without a derived private key");
    }

    const privateKeyInt = hexToNumber(this.privateKey);
    const privateKeyBytes = numberToBytesLE(privateKeyInt);
    const messagesBytes =
      typeof message === "string" ? Buffer.from(message) : message;
    const messageBytes = concatBytes(messagesBytes);
    const seed = randomBytes();

    const nonceDigest = await sha512(seed, privateKeyBytes, messageBytes);
    const nonce = modlLE(nonceDigest);

    const R = scalarMult(G, nonce);
    const A = scalarMult(G, privateKeyInt);

    const serializedR = serialize(R);
    const serializedA = serialize(A);

    const hramDigest = await sha512(serializedR, serializedA, messageBytes);
    const hram = modlLE(hramDigest);

    const s = mod(hram * privateKeyInt + nonce, CURVE.l);
    const signature = concatBytes(serializedR, numberToBytesLE(s));

    return signature;
  }
}
