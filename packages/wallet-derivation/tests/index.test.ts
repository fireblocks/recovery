import { deriveWallet } from "../src";

const xprv =
  "xprv9s21ZrQH143K2zPNSbKDKusTNW4XVwvTCCEFvcLkeNyauqJJd9UjZg3AtfZbmXa22TFph2NdACUPoWR4sCqMCKQM1j7jRvLuBCF3YoapsX6";
const xpub =
  "xpub661MyMwAqRbcFUTqYcrDh3pBvXu1uQeJZR9rizkNCiWZnddTAgnz7UMejwX7u4xLmh2JMTtL7DdZmBWGUKa7v836UarassQ3DVFATMzRycV";
const fprv =
  "fprv4LsXPWzhTTp9ax8NGVwbnRFuT3avVQ4ydHNWcu8hCGZd18TRKxgAzbrpY9bLJRe4Y2AyX9TfQdDPbmqEYoDCTju9QFZbUgdsxsmUgfvuEDK";
const fpub =
  "fpub8sZZXw2wbqVpURAAA9cCBpv2256rejFtCayHuRAzcYN1qciBxMVmB6UgiDAQTUZh5EP9JZciPQPjKAHyqPYHELqEHWkvo1sxreEJgLyfCJj";

const path = { account: 0, changeIndex: 0, addressIndex: 0 };

describe("deriveWallet()", () => {
  it("should derive a BTC SegWit wallet using xprv", () => {
    const wallet = deriveWallet({
      assetId: "BTC",
      xprv,
      path,
    });

    expect(wallet.address).toEqual(
      "bc1q9dttlwuva9xrvsz98tk8x7c6u9snf25yxs6t6s"
    );

    expect(wallet.publicKey).toEqual(
      "0x020383047c8dbb013ce0c54c491c9a86ed720a8369b0d0911281fc3e95d1c9cdbf"
    );

    expect(wallet.privateKey).toEqual(
      "0xf5a2a2f50b3461967063843c293d03dab8ff58e85b52b56e3a3ec37dc5fb36bc"
    );

    expect(wallet.wif).toEqual(
      "L5TCCDDQ2n9WnX3QVXubrZAryn5uoWQcTjube4N6frro2tbfLoiE"
    );
  });

  it("should derive a BTC SegWit wallet using xpub", () => {
    const wallet = deriveWallet({
      assetId: "BTC",
      xpub,
      path,
    });

    expect(wallet.address).toEqual(
      "bc1q9dttlwuva9xrvsz98tk8x7c6u9snf25yxs6t6s"
    );

    expect(wallet.publicKey).toEqual(
      "0x020383047c8dbb013ce0c54c491c9a86ed720a8369b0d0911281fc3e95d1c9cdbf"
    );

    expect(wallet.privateKey).toBeUndefined();

    expect(wallet.privateKey).toBeUndefined();
  });

  it("should derive a BTC Legacy wallet using xprv", () => {
    const wallet = deriveWallet({
      assetId: "BTC",
      xprv,
      path,
      isLegacy: true,
    });

    expect(wallet.address).toEqual("14x9yfxxbpZiPsvJ7j3rrzNFaZcPXAoJ8D");

    expect(wallet.publicKey).toEqual(
      "0x020383047c8dbb013ce0c54c491c9a86ed720a8369b0d0911281fc3e95d1c9cdbf"
    );

    expect(wallet.privateKey).toEqual(
      "0xf5a2a2f50b3461967063843c293d03dab8ff58e85b52b56e3a3ec37dc5fb36bc"
    );

    expect(wallet.wif).toEqual(
      "L5TCCDDQ2n9WnX3QVXubrZAryn5uoWQcTjube4N6frro2tbfLoiE"
    );
  });

  it("should derive a BTC Legacy wallet using xpub", () => {
    const wallet = deriveWallet({
      assetId: "BTC",
      xpub,
      path,
      isLegacy: true,
    });

    expect(wallet.address).toEqual("14x9yfxxbpZiPsvJ7j3rrzNFaZcPXAoJ8D");

    expect(wallet.publicKey).toEqual(
      "0x020383047c8dbb013ce0c54c491c9a86ed720a8369b0d0911281fc3e95d1c9cdbf"
    );

    expect(wallet.privateKey).toBeUndefined();

    expect(wallet.wif).toBeUndefined();
  });

  it("should derive an ETH wallet using xprv", () => {
    const wallet = deriveWallet({
      assetId: "ETH",
      xprv,
      path,
    });

    expect(wallet.address).toEqual(
      "0x9f3A41DF8191Cf4605623dD637326CBc63D1d92f"
    );

    expect(wallet.publicKey).toEqual(
      "0x02b5586fb410aafd76305705149069f7282de8b7a535ab96a252a41208edf78737"
    );

    expect(wallet.privateKey).toEqual(
      "0x8ba67635bb70671fe97e7046adaeed3029fff7c6e4cdef8d7bc2bf1ddd893feb"
    );

    expect(wallet.wif).toEqual(
      "L1uAyDoR7uYUZ2yLcg86jfuTcgxNmqpBcuQKXgVAVXRwCW2YPaC2"
    );
  });

  it("should derive an ETH wallet using xpub", () => {
    const wallet = deriveWallet({
      assetId: "ETH",
      xpub,
      path,
    });

    expect(wallet.address).toEqual(
      "0x9f3A41DF8191Cf4605623dD637326CBc63D1d92f"
    );

    expect(wallet.publicKey).toEqual(
      "0x02b5586fb410aafd76305705149069f7282de8b7a535ab96a252a41208edf78737"
    );

    expect(wallet.privateKey).toBeUndefined();

    expect(wallet.wif).toBeUndefined();
  });

  it("should derive a SOL wallet using fprv", () => {
    const wallet = deriveWallet({
      assetId: "SOL",
      fprv,
      path,
    });

    expect(wallet.address).toEqual(
      "Es8cMivoZYEsCfKBYvZEkgeyYN3saNpzfkoagUBCLy5p"
    );

    expect(wallet.publicKey).toEqual(
      "0xcdff9320114119fd2add3a20b5cf852470dc08d4cefb31874304d3813a0ad51f"
    );

    expect(wallet.privateKey).toEqual(
      "0x0770b61f53acbc7e59024fb2f012f4ade45cb56e0adc191f21f4361c19521952"
    );

    expect(wallet.wif).toBeUndefined();
  });

  it("should derive a SOL wallet using fpub", () => {
    const wallet = deriveWallet({
      assetId: "SOL",
      fpub,
      path,
    });

    expect(wallet.address).toEqual(
      "Es8cMivoZYEsCfKBYvZEkgeyYN3saNpzfkoagUBCLy5p"
    );

    expect(wallet.publicKey).toEqual(
      "0xcdff9320114119fd2add3a20b5cf852470dc08d4cefb31874304d3813a0ad51f"
    );

    expect(wallet.privateKey).toBeUndefined();

    expect(wallet.wif).toBeUndefined();
  });
});
