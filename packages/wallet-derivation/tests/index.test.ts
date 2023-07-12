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
    }
  });

  it(`should derive a ${resolvedLabel} wallet using ${isEcdsa ? 'xpub' : 'fpub'}`, () => {
    expect(publicWallet.address).toEqual(address);
    expect(publicWallet.publicKey).toEqual(publicKey);
    expect(publicWallet.privateKey).toBeUndefined();
    expect(publicWallet.wif).toBeUndefined();
  });
};

const testInputs: Input[] = [
  {
    assetId: 'BTC',
    label: 'BTC SegWit',
    address: 'bc1q9dttlwuva9xrvsz98tk8x7c6u9snf25yxs6t6s',
    publicKey: '0x020383047c8dbb013ce0c54c491c9a86ed720a8369b0d0911281fc3e95d1c9cdbf',
    privateKey: '0xf5a2a2f50b3461967063843c293d03dab8ff58e85b52b56e3a3ec37dc5fb36bc',
    wif: 'L5TCCDDQ2n9WnX3QVXubrZAryn5uoWQcTjube4N6frro2tbfLoiE',
  },
  {
    assetId: 'BTC',
    label: 'BTC Legacy',
    address: '14x9yfxxbpZiPsvJ7j3rrzNFaZcPXAoJ8D',
    publicKey: '0x020383047c8dbb013ce0c54c491c9a86ed720a8369b0d0911281fc3e95d1c9cdbf',
    privateKey: '0xf5a2a2f50b3461967063843c293d03dab8ff58e85b52b56e3a3ec37dc5fb36bc',
    wif: 'L5TCCDDQ2n9WnX3QVXubrZAryn5uoWQcTjube4N6frro2tbfLoiE',
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
  {
    assetId: 'ADA',
    address: 'addr1qxk0uuhghpk2zxpzth5ryv20fmfem3ym4pxektwjzvfumrchg6feqy3pzpzm63kpvt2ayh5qcwxf8prey4swhgmqld6srxkf3u',
    publicKey: '0xeaaa12a33e195e895ea243a5626153cea5e555ce9727b5b15d821517f5cc889b',
    privateKey: '0x0273089a7023d7983acb96e9e9f9ecc3b86b10f0c0189e38373c31aeec896910',
  },
  // {
  //   assetId: 'ALGO',
  // address: '',
  // publicKey: '',
  // privateKey: '',
  // },
  {
    assetId: 'XLM',
    address: 'GAE4W2P7KSNGHXUM4D4QCBSJONM2KRE5DWZ6JLMV5JGJMV4FUBIP6XXM',
    publicKey: '0x09cb69ff549a63de8ce0f90106497359a5449d1db3e4ad95ea4c965785a050ff',
    privateKey: '0x055bce7daf3b7e0f3e202a07a7ef54ee649fd98a189522a1eeb436bb197f60a3',
  },
  {
    assetId: 'NEAR',
    address: '0a827b91edbfb42032af23e7e22aa5d055fa04d73f3743af08977640de5cfa74',
    publicKey: '0x0a827b91edbfb42032af23e7e22aa5d055fa04d73f3743af08977640de5cfa74',
    privateKey: '0x0bd00a11b419be4d7f3ac3ba2b2f64fe1f726fb74b38031774930aa70cb6f13a',
  },
  {
    assetId: 'XTZ',
    address: 'tz1VaDzcRFJcFwbUytdf8dMasrs4z67GUTGF',
    publicKey: '0xb07486d20ccceef8be523395ac9f82be23e9f6067b76c26b5effe17978b5d6c3',
    privateKey: '0x04e7b615a460d8635dc4616b494e9b9bbe0b0831370eeccae2cebe764a09fab9',
  },
  // {
  //   assetId: 'DOT',
  //   address: '',
  //   publicKey: '',
  //   privateKey: '',
  // },
  {
    assetId: 'KSM',
    address: 'E8rsLhGkb2oALVKtFPEGXr47kF9pUKtUu1XRu1JPdwdGpgb',
    publicKey: '0x450d9f845f135c2f88af0800590f23a1c5591dfe5a273a4e9ce58a5a5fbd3891',
    privateKey: '0x023c70d8ba32ffa8e518dac21ba3bd34b8e8e9b7610e3d09d0f61d465400c3d6',
  },
  {
    assetId: 'XEM',
    address: 'NDPGUVI3WEXUQNDXE57WKKRRPP7XS3ICVCM5T3BZ',
    publicKey: '0x16b08e36c117309ed7a84b244c3adc6bb2af87e394ccc9fb2206761f5be9c0aa',
    privateKey: '0x0d7c5c36903dd8b9e59d14cc5b982e125816f7ceea7e76e84390b51361c63d8d',
  },
  // {
  //   assetId: 'HBAR',
  //   address: '',
  //   publicKey: '0x8e6374384a807cb3b0c6ddc0ce1c33a92d1e463332183b16ad781b45f9de9977',
  //   privateKey: '0x087345bf484c7d4935248ac137476419aa0b1bbbeab1a35728deb320d8a0769c',
  // },
  {
    assetId: 'BSV',
    address: '17VkvGT8qF2ZsqC4bEAxc4DYJL8dxBz6VK',
    publicKey: '0x0325618646c57ec6611dc49f6ac7885846797196f6f09fb5f76b46719294a877f5',
    privateKey: '0xe10d8a9a0671fa30ba78ee51cbf0711e4e9690dfcc3c19a62afeaac52fd04641',
    wif: 'L4mBeFLMnmPLtC97g4Z7PKsFVpDK7mLvtGKpK7uK5ZPQase7JUhR',
  },
  // {
  //   assetId: 'BCH',
  //   label: 'BCH CashAddr',
  //   address: 'qz38v5pg3ylhhnz5l7acvetpmfvwgqqu5sut4u63a7',
  //   publicKey: '0x02e8c5da72a815171a1ce1b83a4bcc4ed3f5ebae5130efa553f423cda44995237f',
  //   privateKey: '0x2d99db17d8ccdf1adae8844f186ae7786235aadfff59bb4fe46b9bd4c7e27882',
  //   wif: 'KxkMSdvRGsxoKeCSLHLme95qvmph9eYCtXRSPgGS83Ls3vzXKsJE',
  // },
  // {
  //   assetId: 'BCH',
  //   label: 'BCH Legacy',
  //   address: '1Fp2CcjdH1XXoARC1uVbMxz9DfAiyqZpSJ',
  //   publicKey: '0x02e8c5da72a815171a1ce1b83a4bcc4ed3f5ebae5130efa553f423cda44995237f',
  //   privateKey: '0x2d99db17d8ccdf1adae8844f186ae7786235aadfff59bb4fe46b9bd4c7e27882',
  //   wif: 'KxkMSdvRGsxoKeCSLHLme95qvmph9eYCtXRSPgGS83Ls3vzXKsJE',
  // },
  {
    assetId: 'DOGE',
    address: 'DCc8MMva4spM7VfBozQPoCgvZmvbXDWJL1',
    publicKey: '0x02955e78f6ba978dd1ad25523b300074fe2865d2a90f41df3421370910d3c547dc',
    privateKey: '0x24849411b02b2dc60f90cd26a4eae8dd23323d440d2622f32be9f42e75e48fda',
    wif: 'QPqcXPSHvA59THJFj6P6CCmCB3k2yhkQ5QpMzQ34HytsYiN5tXin',
  },
  // {
  //   assetId: 'EOS',
  // address: '',
  // publicKey: '',
  // privateKey: '',
  // },
  {
    assetId: 'LTC',
    address: 'LgwRUi42gdwXVErQoUfieh5389FP5SHjx6',
    publicKey: '0237a71c666e1e2287d927bf61130ca20ad72fd7e0af6a7c2a2244665e72befcb9',
    privateKey: 'T3rLaYkw6kvaJkAbsdGYwGKQK1bW3oNmVHkjxdfbdN3SMwGXNfFT',
  },
  // {
  //   assetId: 'ZEC',
  // address: '',
  // publicKey: '',
  // privateKey: '',
  // },
  {
    assetId: 'LUNA2',
    address: 'terra1ltra5sf3lkhvzergghzajlx553ul548kuw2vqu',
    publicKey: '0x023dfe0b1de9d655d3a792b71ce2effd1e363299f943b36fb44cd8b41b13442d55',
    privateKey: '0x25a89201b79b7f8e1c050ecf151bc20fddb522b3a8c0f677301a8b775e1ba731',
  },
  {
    assetId: 'DASH',
    address: 'XbYavDPHGRJVDyVgLa4j6ZtaMtjG3h8ndh',
    publicKey: '0x0232aa5aee73d1caf6ffd9d1caf9ebe0cb9ec307f1c1eecb92e0e9292321723c44',
    privateKey: '0x09e0352d4e9f4fccb227c5d9112b6d772af3c6c441b2654101057ddb34a60a74',
    wif: 'XBcq5bYgjqoGwJxuQHcRKBF8hqCyJ44zxG6JTUj1qtuQgpS8iLZB',
  },
  {
    assetId: 'TRX',
    address: 'TQChTm3VxQc2gptvp4Rfm4ayoQ7wyvzj1B',
    publicKey: '0x03cf6ba8fc61357a10647a0b069e47a501dba09e970fabb306804ad0235ec75043',
    privateKey: '0x695f865c209767e18883917ed6665be3a7cfa77e42e2a9a92c3c4ef3dc22d6bd',
  },
  {
    assetId: 'ETC',
    address: '0x9d3e052eC15978aE1FC134a58162Cb2F8447Ad48',
    publicKey: '0x026f16eafade331a78430acdfffa59fa789221e27dfd89e3874786c188ba435241',
    privateKey: '0x2ae6001c0730e16f3e4f58122567c8ebbe8aa182ff57009f85c5e71d95d31fac',
  },
  {
    assetId: 'XRP',
    address: 'rPG5VsMdG2KttU5NR5YQ5RtjapegMZvkqJ',
    publicKey: '0x02f22ce2d208ac9b6dedea77c48cae334705f88627db210204d39f97ae98bdfa46',
    privateKey: '0xb5846d4cb20b42e86022191a8b52f236396395c451f07674b5e8fc80edefe0fb',
  },
];

describe('deriveWallet()', () => testInputs.forEach(derivationTest));
