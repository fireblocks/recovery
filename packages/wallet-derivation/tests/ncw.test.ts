import { MasterWallet } from '@fireblocks/extended-key-recovery';
import { NCWallet } from '../wallets/NCWallet';

const basicMasterWallet: MasterWallet = {
  walletSeed: '3c590f865cdf272d9e0490f5918b1a5e4904b07e7c0beccf40ad33d82ba26102',
  assetSeed: 'fb8b1b0c95c1247459616a23aa11c3a5aea26c4b0f2c53471e4e4b7f574929d1',
  masterKeyForCosigner: {
    '21926ecc-4a8a-4614-bbac-7c591aa7efdd': '0de5a6cf9a4b2f6ba69a7f8348b9fb54df48d5af176c2564d9349425a7efe31c',
  },
};

const euWallet = new NCWallet(basicMasterWallet);

const algorithm = 'MPC_ECDSA_SECP256K1';

describe('Non-custodial wallet tests', () => {
  it('Should derive shares successfully', () => {
    let derivedShares = euWallet.derivePrivateKey('2d33e419-4c84-44b1-9d9a-3598f96642b0', algorithm);
    expect(derivedShares.shares.map(({ cosigner }) => cosigner)).toStrictEqual(['21926ecc-4a8a-4614-bbac-7c591aa7efdd']);
    expect(derivedShares.shares.filter(({ cosigner }) => cosigner === '21926ecc-4a8a-4614-bbac-7c591aa7efdd')[0].ECDSA).toBe(
      'f357ec43a3aba03aeccd4727db2ab43afb472b12fe690c2266dbf8e9294ad25d',
    );

    derivedShares = euWallet.derivePrivateKey('69c4e0de-946f-45db-954d-4d890a5af0fe', algorithm);
    expect(derivedShares.shares.map(({ cosigner }) => cosigner)).toStrictEqual(['21926ecc-4a8a-4614-bbac-7c591aa7efdd']);
    expect(derivedShares.shares.filter(({ cosigner }) => cosigner === '21926ecc-4a8a-4614-bbac-7c591aa7efdd')[0].ECDSA).toBe(
      '165270c168ae45c8980a44179622c521ffe5a5251191ace11ecdf52bf63d6fa0',
    );
  });

  it('Should fail deriving with missing wallet id', () => {
    expect(() => euWallet.derivePrivateKey('', algorithm)).toThrow('Invalid wallet ID, must be a UUID: ');
    expect(() => euWallet.derivePrivateKey('not-a-wallet-id', algorithm)).toThrow(
      'Invalid wallet ID, must be a UUID: not-a-wallet-id',
    );
  });

  it('Should fail deriving with bad algorithm', () => {
    expect(() => euWallet.derivePrivateKey('2d33e419-4c84-44b1-9d9a-3598f96642b0', '')).toThrow('Unsupported algorithm: ');
    expect(() => euWallet.derivePrivateKey('2d33e419-4c84-44b1-9d9a-3598f96642b0', 'not-an-algo')).toThrow(
      'Unsupported algorithm: not-an-algo',
    );
  });

  it('Should derive asset chaincode', () => {
    const assetCode = euWallet.deriveAssetChainCode('2d33e419-4c84-44b1-9d9a-3598f96642b0');
    expect(assetCode).toBe('43f48c974efdbbac14e5864fe2f0aec8a13e5f8b823df5052fddf0a9fa24367b');
  });

  it('Should fail deriving asset chaincode with bad wallet id', () => {
    expect(() => euWallet.deriveAssetChainCode('')).toThrow('Invalid wallet ID, must be a UUID: ');
    expect(() => euWallet.deriveAssetChainCode('not-a-wallet-id')).toThrow('Invalid wallet ID, must be a UUID: not-a-wallet-id');
  });
});
