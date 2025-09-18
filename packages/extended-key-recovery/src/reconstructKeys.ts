/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { modPow } from 'bigint-mod-arith';
import { encode as encode_b58check, decode as decode_b58check } from 'bs58check';

import { CalculatedPrivateKeysets, PlayerData, UnknownAlgorithmError } from './types';
import { Algorithm } from './algorithms';
import { SigningKeysMap } from './metadata';

const _lagrangeCoefficient = (myId: string, allIds: string[], field: bigint): bigint => {
  function _primeModInverse(x: bigint, p: bigint): bigint {
    return modPow(x, p - BigInt(2), p);
  }

  let coefficient = BigInt(1);
  for (const id of allIds) {
    if (id === myId) {
      continue;
    }

    let tmp = _primeModInverse((BigInt(id) - BigInt(myId)) % field, field);
    tmp = (tmp * BigInt(id)) % field;
    coefficient *= tmp;
  }
  return coefficient;
};

const _encodeKey = (key: string, algorithm: Algorithm, chainCode: Buffer, isPub: boolean): string => {
  const buffers: Buffer[] = [];
  const keyBuffer = isPub
    ? Buffer.from(key.length === 66 ? key : '0'.repeat(66 - key.length) + key, 'hex')
    : Buffer.from(key.length === 64 ? key : '0'.repeat(64 - key.length) + key, 'hex');
  const isECDSA = algorithm === 'MPC_CMP_ECDSA_SECP256K1' || algorithm === 'MPC_ECDSA_SECP256K1';
  if (isPub) {
    buffers.push(Buffer.from(isECDSA ? '0488B21E' : '03273e4b', 'hex'));
  } else {
    buffers.push(Buffer.from(isECDSA ? '0488ADE4' : '03273a10', 'hex'));
  }
  buffers.push(Buffer.from('000000000000000000', 'hex'));
  buffers.push(chainCode);
  if (!isPub) {
    buffers.push(Buffer.from('00', 'hex'));
  }
  buffers.push(keyBuffer);
  // @ts-ignore
  return encode_b58check(Buffer.concat(buffers));
};

const _decodeKey = (prv: string): [string, Buffer] => {
  // Only used on xprv, so key length should be 64
  const prvBuffer = Buffer.from(decode_b58check(prv));
  // read first 13 bytes (0->13) are algorithm and padding, not relevant for the purposes fo this function
  let offset = 13;
  const chainCodeValues: number[] = [];
  let readValue = prvBuffer.readUint8(offset);
  while (readValue !== 0) {
    chainCodeValues.push(readValue);
    offset += 1;
    readValue = prvBuffer.readUint8(offset);
  }
  offset += 1; // skip 0 byte padding in xprv/fprv
  const chainCode = Buffer.from(chainCodeValues);
  const key = prvBuffer.subarray(offset, offset + 32);

  return [key.toString('hex'), chainCode];
};

const calculateKeys = (keyId: string, playerData: { [key: string]: bigint }, algo: Algorithm): [string, string] => {
  let prvKey = BigInt(0);
  let pubKey: bigint | string = BigInt(-1);
  if (algo === 'MPC_ECDSA_SECP256K1') {
    for (const playerId of Object.keys(playerData)) {
      prvKey =
        (prvKey + playerData[playerId] * _lagrangeCoefficient(playerId, Object.keys(playerData), secp256k1.CURVE.n)) %
        secp256k1.CURVE.n;
    }
    // @ts-ignore
    pubKey = secp256k1.ProjectivePoint.BASE.multiply(prvKey).toHex();
  } else if (algo === 'MPC_EDDSA_ED25519') {
    for (const playerId of Object.keys(playerData)) {
      prvKey =
        (prvKey + playerData[playerId] * _lagrangeCoefficient(playerId, Object.keys(playerData), ed25519.CURVE.n)) %
        ed25519.CURVE.n;
    }
    // @ts-ignore
    pubKey = ed25519.ExtendedPoint.BASE.multiply(prvKey).toHex();
  } else if (algo === 'MPC_CMP_ECDSA_SECP256K1') {
    for (const playerId of Object.keys(playerData)) {
      prvKey = (prvKey + playerData[playerId]) % secp256k1.CURVE.n;
    }
    // @ts-ignore
    pubKey = secp256k1.ProjectivePoint.BASE.multiply(prvKey).toHex();
  } else if (algo === 'MPC_CMP_EDDSA_ED25519') {
    for (const playerId of Object.keys(playerData)) {
      prvKey = (prvKey + playerData[playerId]) % ed25519.CURVE.n;
    }
    // @ts-ignore
    pubKey = ed25519.ExtendedPoint.BASE.multiply(prvKey).toHex();
  } else {
    throw new UnknownAlgorithmError();
  }

  return [prvKey.toString(16).replace('0x', ''), pubKey as string];
};

export const reconstructKeys = (players: PlayerData, signingKeys: SigningKeysMap): CalculatedPrivateKeysets | undefined => {
  const privateKeys: CalculatedPrivateKeysets = {};

  const knownKeyIds = Object.keys(players).filter((key) => key in signingKeys);
  for (const keyId of knownKeyIds) {
    const playerDataForKey = players[keyId];
    const { algo, chainCode, keysetId } = signingKeys[keyId];
    const [prvKey, pubKey] = calculateKeys(keyId, playerDataForKey, algo);
    const pubFromMetadata = signingKeys[keyId].publicKey;
    if (pubFromMetadata !== pubKey) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to recover ${algo} key. Expected public key is ${pubFromMetadata} got: ${BigInt(`0x${pubKey}`).toString(16)}.`,
      );
      return undefined;
    }
    if (Object.keys(prvKey).includes(algo)) {
      continue;
    }

    if (!privateKeys[keysetId]) {
      privateKeys[keysetId] = {};
    }
    privateKeys[keysetId][algo] = {
      prvKey: _encodeKey(prvKey, algo, chainCode as unknown as Buffer, false),
      pubKey: _encodeKey(pubKey, algo, chainCode as unknown as Buffer, true),
      chainCode: Buffer.from(chainCode!).toString('hex'),
    };
  }

  return privateKeys;
};

export const getPubsFromPrvs = (xprv?: string, fprv?: string): [string, string] => {
  const result: [string, string] = ['', ''];
  if (xprv) {
    const [xDecodedPrv, xChaincode] = _decodeKey(xprv);
    const xPubKey = secp256k1.ProjectivePoint.BASE.multiply(BigInt(`0x${xDecodedPrv}`)).toHex();
    result[0] = _encodeKey(xPubKey, 'MPC_ECDSA_SECP256K1', xChaincode, true);
  }
  if (fprv) {
    const [fDecodedPrv, fChaincode] = _decodeKey(fprv);
    const fPubKey = ed25519.ExtendedPoint.BASE.multiply(BigInt(`0x${fDecodedPrv}`)).toHex();
    result[1] = _encodeKey(fPubKey, 'MPC_EDDSA_ED25519', fChaincode, true);
  }
  return result;
};
