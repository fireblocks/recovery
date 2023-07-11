import { deriveWallet } from '..';

const path = { account: 0, changeIndex: 0, addressIndex: 0 };
const xprv = 'xprv9s21ZrQH143K2zPNSbKDKusTNW4XVwvTCCEFvcLkeNyauqJJd9UjZg3AtfZbmXa22TFph2NdACUPoWR4sCqMCKQM1j7jRvLuBCF3YoapsX6';
const xpub = 'xpub661MyMwAqRbcFUTqYcrDh3pBvXu1uQeJZR9rizkNCiWZnddTAgnz7UMejwX7u4xLmh2JMTtL7DdZmBWGUKa7v836UarassQ3DVFATMzRycV';
const fprv = 'fprv4LsXPWzhTTp9ax8NGVwbnRFuT3avVQ4ydHNWcu8hCGZd18TRKxgAzbrpY9bLJRe4Y2AyX9TfQdDPbmqEYoDCTju9QFZbUgdsxsmUgfvuEDK';
const fpub = 'fpub8sZZXw2wbqVpURAAA9cCBpv2256rejFtCayHuRAzcYN1qciBxMVmB6UgiDAQTUZh5EP9JZciPQPjKAHyqPYHELqEHWkvo1sxreEJgLyfCJj';

type Input = {
  /** Fireblocks asset ID */
  assetId: string;
  /** Test label for asset ID */
  label?: string;
  /** Expected address */
  address: string;
  /** Expected public key */
  publicKey: string;
  /** Expected private key */
  privateKey: string;
  /** Expected private key WIF */
  wif?: string;
  /** Is legacy derivation (vs SegWit) */
  isLegacy?: true;
};

const derivationTest = ({ assetId, label, address, privateKey, publicKey, wif, isLegacy }: Input) => {
  const resolvedLabel = label || assetId;
  const privateWallet = deriveWallet({ path, xprv, fprv, assetId, isLegacy });
  const publicWallet = deriveWallet({ path, xpub, fpub, assetId, isLegacy });
  const isEcdsa = privateWallet.algorithm === 'ECDSA';

  it(`should derive a ${resolvedLabel} wallet using ${isEcdsa ? 'xprv' : 'fprv'}`, () => {
    expect(privateWallet.address).toEqual(address);
    expect(privateWallet.publicKey).toEqual(publicKey);
    expect(privateWallet.privateKey).toEqual(privateKey);
    if (wif) {
      expect(privateWallet.wif).toEqual(wif);
    } else {
      expect(privateWallet.wif).toBeUndefined();
    }
  });

  it(`should derive a ${resolvedLabel} wallet using ${isEcdsa ? 'xpub' : 'fpub'}`, () => {
    expect(publicWallet.address).toEqual(address);
    expect(publicWallet.publicKey).toEqual(publicKey);
    expect(publicWallet.privateKey).toBeUndefined();
    expect(publicWallet.wif).toBeUndefined();
  });
};

const btcBaseInput = {
  assetId: 'BTC',
  publicKey: '0x020383047c8dbb013ce0c54c491c9a86ed720a8369b0d0911281fc3e95d1c9cdbf',
  privateKey: '0xf5a2a2f50b3461967063843c293d03dab8ff58e85b52b56e3a3ec37dc5fb36bc',
  wif: 'L5TCCDDQ2n9WnX3QVXubrZAryn5uoWQcTjube4N6frro2tbfLoiE',
};

const testInputs: Input[] = [
  {
    ...btcBaseInput,
    label: 'BTC SegWit',
    address: 'bc1q9dttlwuva9xrvsz98tk8x7c6u9snf25yxs6t6s',
  },
  {
    ...btcBaseInput,
    label: 'BTC Legacy',
    address: '14x9yfxxbpZiPsvJ7j3rrzNFaZcPXAoJ8D',
    isLegacy: true,
  },
  {
    assetId: 'ETH',
    address: '0x9f3A41DF8191Cf4605623dD637326CBc63D1d92f',
    publicKey: '0x02b5586fb410aafd76305705149069f7282de8b7a535ab96a252a41208edf78737',
    privateKey: '0x8ba67635bb70671fe97e7046adaeed3029fff7c6e4cdef8d7bc2bf1ddd893feb',
    wif: 'L1uAyDoR7uYUZ2yLcg86jfuTcgxNmqpBcuQKXgVAVXRwCW2YPaC2',
  },
  {
    assetId: 'SOL',
    address: 'Es8cMivoZYEsCfKBYvZEkgeyYN3saNpzfkoagUBCLy5p',
    publicKey: '0xcdff9320114119fd2add3a20b5cf852470dc08d4cefb31874304d3813a0ad51f',
    privateKey: '0x0770b61f53acbc7e59024fb2f012f4ade45cb56e0adc191f21f4361c19521952',
  },
  {
    assetId: 'ATOM_COS',
    address: 'cosmos1uy8v5s0x6kq0lwy200es8ecy2xzjzkhwvre950',
    publicKey: '0x0339b35362e0a934b62e0cfb57a6550ebae27d0e1eedd3c03da55097d7b0eb0936',
    privateKey: '0xec9e9b2673bc7e3bc21aff716581ade5b95d21283d4c0ce1a3cc44cdcbc3036c',
    wif: 'L59fifpQPPwpPbvR423ncVAK9mDCDr1qzGhd9KQ1zMi5UZpeUsqA',
  },
];

describe('deriveWallet()', () => testInputs.forEach(derivationTest));
