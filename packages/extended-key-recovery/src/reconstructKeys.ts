import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { modPow } from 'bigint-mod-arith';
import { encode as encode_b58check } from 'bs58check';

import { Algorithm, CalculatedPrivateKey, PlayerData, SigningKeyMetadata, UnknownAlgorithmError } from './types';

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
  const isECDSA = algorithm === 'MPC_ECDSA_SECP256K1' || algorithm === 'MPC_CMP_ECDSA_SECP256K1';
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
  return encode_b58check(Buffer.concat(buffers));
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

export const reconstructKeys = (
  players: PlayerData,
  signingKeys: { [key: string]: SigningKeyMetadata },
): CalculatedPrivateKey | undefined => {
  const privateKeys: CalculatedPrivateKey = {};
  for (const keyId of Object.keys(players).filter((key) => key in signingKeys)) {
    const playerDataForKey = players[keyId];
    const { algo, chainCode } = signingKeys[keyId];
    let [prvKey, pubKey] = calculateKeys(keyId, playerDataForKey, algo);
    const pubFromMetadata = signingKeys[keyId].publicKey;
    if (pubFromMetadata !== pubKey) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to recover ${algo} key. Expected public key is ${pubFromMetadata} got: ${BigInt(`0x${pubKey}`).toString(16)}.`,
      );
      return undefined;
    } else {
      if (Object.keys(prvKey).includes(algo)) {
        continue;
      } else {
        privateKeys[algo] = {
          prvKey: _encodeKey(prvKey, algo, chainCode as Buffer, false),
          pubKey: _encodeKey(pubKey, algo, chainCode as Buffer, true),
          chainCode: (chainCode as Buffer).toString('hex'),
        };
      }
    }
  }

  return privateKeys;
};
