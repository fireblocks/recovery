export type Algorithm = 'MPC_ECDSA_SECP256K1' | 'MPC_EDDSA_ED25519' | 'MPC_CMP_ECDSA_SECP256K1' | 'MPC_CMP_EDDSA_ED25519';

export const ECDSA_CMP: Algorithm = 'MPC_CMP_ECDSA_SECP256K1';
export const ECDSA: Algorithm = 'MPC_ECDSA_SECP256K1';
export const EDDSA_CMP: Algorithm = 'MPC_CMP_EDDSA_ED25519';
export const EDDSA: Algorithm = 'MPC_EDDSA_ED25519';

export class InvalidAlgorithmError extends Error {
  constructor(algo: string) {
    super(`Unknown algorithm: ${algo}`);
  }
}

export const getAlgorithmFromString = (algo: string): Algorithm => {
  switch (algo) {
    case 'MPC_CMP_ECDSA_SECP256K1':
      return ECDSA_CMP;
    case 'MPC_ECDSA_SECP256K1':
      return ECDSA;
    case 'MPC_CMP_EDDSA_ED25519':
      return EDDSA_CMP;
    case 'MPC_EDDSA_ED25519':
      return EDDSA;
    default:
      throw new InvalidAlgorithmError(algo);
  }
};
