export type Algorithm =
  | 'MPC_ECDSA_SECP256K1'
  | 'MPC_EDDSA_ED25519'
  | 'MPC_CMP_ECDSA_SECP256K1'
  | 'MPC_CMP_EDDSA_ED25519'
  | 'MPC_BAM_ECDSA_SECP256K1'
  | 'MPC_FROST_EDDSA_ED25519';

export const ECDSA_CMP: Algorithm = 'MPC_CMP_ECDSA_SECP256K1';
export const ECDSA: Algorithm = 'MPC_ECDSA_SECP256K1';
export const EDDSA_CMP: Algorithm = 'MPC_CMP_EDDSA_ED25519';
export const EDDSA: Algorithm = 'MPC_EDDSA_ED25519';
export const ECDSA_BAM: Algorithm = 'MPC_BAM_ECDSA_SECP256K1';
export const EDDSA_FROST: Algorithm = 'MPC_FROST_EDDSA_ED25519';

// Grouped by curve. The order is also the key-selection priority (see tryGetRecoveredKeyForKeyset).
export const ECDSA_ALGORITHMS: Algorithm[] = [ECDSA, ECDSA_CMP, ECDSA_BAM];
export const EDDSA_ALGORITHMS: Algorithm[] = [EDDSA, EDDSA_CMP, EDDSA_FROST];

export class InvalidAlgorithmError extends Error {
  constructor(algo: string) {
    super(`Unknown algorithm: ${algo}`);
  }
}

export const getAlgorithmFromString = (algo: string): Algorithm => {
  switch (algo) {
    case ECDSA_CMP:
      return ECDSA_CMP;
    case ECDSA:
      return ECDSA;
    case EDDSA_CMP:
      return EDDSA_CMP;
    case EDDSA:
      return EDDSA;
    case ECDSA_BAM:
      return ECDSA_BAM;
    case EDDSA_FROST:
      return EDDSA_FROST;
    default:
      throw new InvalidAlgorithmError(algo);
  }
};
