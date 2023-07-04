import { recoverKeys } from '../index';
import { KeyRecoveryConfig } from '../types';
import * as TestData from './test_data.json';

describe('Extended Key Recovery', () => {
  it('Should recover basic ECDSA only package', async () => {
    //@ts-ignore
    const recoveryConfig: KeyRecoveryConfig = {
      zipBase64: TestData.backup,
      rsaBase64: Buffer.from(privateKey).toString('base64'),
      mobilePass: 'Thefireblocks1!',
      recoveryPrv: true,
    };

    const recovered = await recoverKeys(recoveryConfig);
    expect(recovered.xprv).toEqual(
      'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzF9aunJDs4SsrmoxycAo6xxBTHawSz5sYxEy8TpCkv66Sci373DJ',
    );
    expect(recovered.xpub).toEqual(
      'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6QJJZSgiCXT6sq7wa2jCk5t4Vv1r1E4q1venKghAAdyzieufGyX',
    );
  });

  it('Should recover basic full package', async () => {
    //@ts-ignore
    const recoveryConfig: KeyRecoveryConfig = {
      zipBase64: TestData.newBackup,
      rsaBase64: Buffer.from(privateKey2).toString('base64'),
      mobilePass: 'Thefireblocks1!',
      recoveryPrv: true,
    };

    const recovered = await recoverKeys(recoveryConfig);
    expect(recovered.xprv).toEqual(
      'xprv9s21ZrQH143K2zPNSbKDKusTNW4XVwvTCCEFvcLkeNyauqJJd9UjZg3AtfZbmXa22TFph2NdACUPoWR4sCqMCKQM1j7jRvLuBCF3YoapsX6',
    );
    expect(recovered.xpub).toEqual(
      'xpub661MyMwAqRbcFUTqYcrDh3pBvXu1uQeJZR9rizkNCiWZnddTAgnz7UMejwX7u4xLmh2JMTtL7DdZmBWGUKa7v836UarassQ3DVFATMzRycV',
    );
    expect(recovered.fprv).toEqual(
      'fprv4LsXPWzhTTp9ax8NGVwbnRFuT3avVQ4ydHNWcu8hCGZd18TRKxgAzbrpY9bLJRe4Y2AyX9TfQdDPbmqEYoDCTju9QFZbUgdsxsmUgfvuEDK',
    );
    expect(recovered.fpub).toEqual(
      'fpub8sZZXw2wbqVpURAAA9cCBpv2256rejFtCayHuRAzcYN1qciBxMVmB6UgiDAQTUZh5EP9JZciPQPjKAHyqPYHELqEHWkvo1sxreEJgLyfCJj',
    );
    expect(recovered.chainCodeEcdsa).toEqual('5d90bd21d2273a25d0aea082716bdc4529e007823260ad3479182f6672c25cc4');
    expect(recovered.chainCodeEddsa).toEqual('5d90bd21d2273a25d0aea082716bdc4529e007823260ad3479182f6672c25cc4');
  });

  it('Should recover old format package', async () => {
    //@ts-ignore
    const recoveryConfig: KeyRecoveryConfig = {
      zipBase64: TestData.oldFormatBackup,
      rsaBase64: Buffer.from(privateKey).toString('base64'),
      mobilePass: 'Thefireblocks1!',
      recoveryPrv: true,
    };

    const recovered = await recoverKeys(recoveryConfig);
    expect(recovered.xprv).toEqual(
      'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzF9aunJDs4SsrmoxycAo6xxBTHawSz5sYxEy8TpCkv66Sci373DJ',
    );
    expect(recovered.xpub).toEqual(
      'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6QJJZSgiCXT6sq7wa2jCk5t4Vv1r1E4q1venKghAAdyzieufGyX',
    );
  });

  it('Should recover cmp package', async () => {
    //@ts-ignore
    const recoveryConfig: KeyRecoveryConfig = {
      zipBase64: TestData.cmpBackup,
      rsaBase64: Buffer.from(privateKey).toString('base64'),
      mobilePass: 'Fireblocks1!',
      recoveryPrv: true,
    };

    const recovered = await recoverKeys(recoveryConfig);
    expect(recovered.xprv).toEqual(
      'xprv9s21ZrQH143K3PhnQQqPZm38HtkJ3bjcVmwc1SfGG8ddw3jXtrhSBNFNcVVx7VUL8vPpmMg1dqxhecVq8WJ1VHn9yoeRM88qfYEnEEi6XaQ',
    );
    expect(recovered.xpub).toEqual(
      'xpub661MyMwAqRbcFsnFWSNPvtyrqvanT4TTrzsCoq4spUAcor4gSQ1gjAZrTkzR1o8XZ5uPq6WELaga3Zh1eJyfXLvfkWTfV7AjdFU5VuWMpPp',
    );
    expect(recovered.fprv).toEqual(
      'fprv4LsXPWzhTTp9bMSnEKTn2GRaNSGh33t8vs5rhjTCp2Dg2LtebftscJ52FxRRKeHGLfK6X5Lg3LcsGxQyHZ8ovvPsP2s9PLbZC2VFHc64vFH',
    );
    expect(recovered.fpub).toEqual(
      'fpub8sZZXw2wbqVpUpUa7y8NRg5gwTndCP53WAgdzFVWEJ24rq9RE4iTnngtS2FeusezUsAJb2sZiMvSDqYGeGVSs65wJqYcGzQRuZGM9NHHqog',
    );
  });

  it('Should recover one custom chaincode package', async () => {
    //@ts-ignore
    const recoveryConfig: KeyRecoveryConfig = {
      zipBase64: TestData.oneCustomChaincodeBackup,
      rsaBase64: Buffer.from(privateKey2).toString('base64'),
      mobilePass: 'Thefireblocks1!',
      recoveryPrv: true,
    };

    const recovered = await recoverKeys(recoveryConfig);
    expect(recovered.xprv).toEqual(
      'xprv9s21ZrQH143K3PwZ9jrXG7MZXgj92u6eeCz6M8w8a5RGYJoNmWQRA2eso47rJHr9qawKR9tQVTRki8XUPwVSuBPSnVxT6mQb99XUbruDGk7',
    );
    expect(recovered.xpub).toEqual(
      'xpub661MyMwAqRbcFt22FmPXdFJJ5iZdSMpW1Ruh9XLk8QxFR78XK3ifhpyMeL5NRqEUapho5bQ7SUavfocg14EDcz2CFMhJYiTjBSXbWQcdkrR',
    );
    expect(recovered.fprv).toEqual(
      'fprv4LsXPWzhTTp9ax8NGVwbnRFuT3avVQ4ydHNWcu8hCGZd18TRKxgAzbrpY9bLJRe4Y2AyX9TfQdDPbmqEYoDCTju9QFZbUgdsxsmUgfvuEDK',
    );
    expect(recovered.fpub).toEqual(
      'fpub8sZZXw2wbqVpURAAA9cCBpv2256rejFtCayHuRAzcYN1qciBxMVmB6UgiDAQTUZh5EP9JZciPQPjKAHyqPYHELqEHWkvo1sxreEJgLyfCJj',
    );
    expect(recovered.chainCodeEcdsa).toEqual('865b4d6e745c64afc98a7fe32103d6ea775910d4d58e00fe17d2fdd4f8f8f1d0');
    expect(recovered.chainCodeEddsa).toEqual('5d90bd21d2273a25d0aea082716bdc4529e007823260ad3479182f6672c25cc4');
  });
  it('Should recover two custom chaincode package', async () => {
    //@ts-ignore
    const recoveryConfig: KeyRecoveryConfig = {
      zipBase64: TestData.twoCustomChaincodeBackup,
      rsaBase64: Buffer.from(privateKey2).toString('base64'),
      mobilePass: 'Thefireblocks1!',
      recoveryPrv: true,
    };

    const recovered = await recoverKeys(recoveryConfig);
    expect(recovered.xprv).toEqual(
      'xprv9s21ZrQH143K3PwZ9jrXG7MZXgj92u6eeCz6M8w8a5RGYJoNmWQRA2eso47rJHr9qawKR9tQVTRki8XUPwVSuBPSnVxT6mQb99XUbruDGk7',
    );
    expect(recovered.xpub).toEqual(
      'xpub661MyMwAqRbcFt22FmPXdFJJ5iZdSMpW1Ruh9XLk8QxFR78XK3ifhpyMeL5NRqEUapho5bQ7SUavfocg14EDcz2CFMhJYiTjBSXbWQcdkrR',
    );
    expect(recovered.fprv).toEqual(
      'fprv4LsXPWzhTTp9bPcFjmqM7U4drbDYRi1YzzFgrfnWAH3hsnLWeJioBzvyvwYJ5p5SuXjwhVd41wrB3tR1Ep41U2DpkJM3J9JGkuCKiBAyyGz',
    );
    expect(recovered.fpub).toEqual(
      'fpub8sZZXw2wbqVpUre3dRVwWsikRcjUb3CTaHrU9BpoaYr6iGbHGhYPNVYr717NEs15Sjx7Uun6zj2WmGskXQP6Ed9udZYNcUYMeff9hsYTcyr',
    );
    expect(recovered.chainCodeEcdsa).toEqual('865b4d6e745c64afc98a7fe32103d6ea775910d4d58e00fe17d2fdd4f8f8f1d0');
    expect(recovered.chainCodeEddsa).toEqual('89b11d04462618fa6d3981f891f2ae8968d8762f268fdec0a4c440ecafb072dd');
  });

  it('Should recover from a json share package', async () => {
    //@ts-ignore
    const recoveryConfig: KeyRecoveryConfig = {
      zipBase64: TestData.jsonSharesBackup,
      rsaBase64: Buffer.from(privateKey).toString('base64'),
      mobilePass: 'Fireblocks1!',
      recoveryPrv: true,
    };

    const recovered = await recoverKeys(recoveryConfig);
    expect(recovered.xprv).toEqual(
      'xprv9s21ZrQH143K3t8KzyhL6Vme2HdTM5NitiiLLurTdwUUeKuquVi5QFxz4BwXHdp7Pj1efmkgzPSJp92nTPTMsE7sqABVrAnfgcU9yWYxaNL',
    );
    expect(recovered.xpub).toEqual(
      'xpub661MyMwAqRbcGNCo71ELTdiNaKTwkY6aFwdw9JG5CH1TX8EzT32Kx4HTuSnnZHg2d2GEsHt8ZHSEGC68mSxcfkA1xaqKzAgSPAHz11yytGK',
    );
    expect(recovered.fprv).toEqual(
      'fprv4LsXPWzhTTp9bqsKptKiZ1A66q9rLXXFKorb3CeQBq4Wjd4xcJuWqBndhfkSrMeRaojHBsEv7HoHuGGn5uqWQ43MZFTfuYB6gQgGTdGggTm',
    );
    expect(recovered.fpub).toEqual(
      'fpub8sZZXw2wbqVpVJu7iXzJxQpCfrfnVri9u7TNKighc6rua7KjEhj71gQVsivkxG6tV5xNmXLrU3EpaRP8cJZhk9otAfzsZwJsjEqGCjmWEg8',
    );
    expect(recovered.chainCodeEcdsa).toEqual('b72ad958e75f981589e172fd40cad7536c4b04e5d2866f5a5ec53ce6ed12865a');
    expect(recovered.chainCodeEddsa).toEqual('b72ad958e75f981589e172fd40cad7536c4b04e5d2866f5a5ec53ce6ed12865a');
  });
});

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`;

const privateKey2 = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAqXP1s7Mih06Gld7Mg9evDyjGhVHNo2mMzbfAUrFIisUaTFw5
GTnakasZEaYp9+m/ogQ2/GR+FDlaZWLEkrS/jSBklGEoSJOkZMORTzwOMgTpLuMM
ZQSSk9HZm5H+el8Vx5jd/P/LJvY0+LYB/SqDy9RdQqo4JQETLnamYPE5FmHG1V50
U822skJrEh/kjdDFk6RAq3hy/EvuNVgGP22C9TPGXisaFOPVeepVcn5WenW3eMK9
LFSJ4s/7cyzJwuvDh72GW9qQypPn4uxY+2kDKijEK3SdX6OABggOj8utpEBQ745P
yAemF9xtN2QuTslXHh4+LNjrDAqm8D2S5L85NQIDAQABAoIBACToLsGe6IxT3BhU
WHL2zRgeJ27uLD3FRXeg5/Ca0FP5LgsnowANi79iZqljaYyniqd9B4TdVmCNRVUD
uBDD8VyJi56Nsrpr/cg8mC+LwwO98hPWO+LcphgwApdRqv14LEQ21VK/W732rf7l
lXVQhzgj3tQgQu48V7MtAHvozihDdI5zDZtpXF5GMs1+XaTxI/7zxCLO9evX7RU+
d+oge6bPLEqU3IGE1vCcrUk5K9OaaqO6S91kvC7XB9FM5Rd+U3Qxyv+UxSSeiy7Z
R8CQ1HUdN85MDQcqlpVar10T4h0KHQzkCAufDqzAIlkvHlx/aZ/iGFKekaLQeo8/
DhVSpFkCgYEA4OAnnO79j3ZugVLJv6spMgpNeXRSkU33WoY92uGlUp/S1B1Yy5ev
luBPK/Cvr2cjMQA2IeI1BvEvT6GRXd01cQ78cxECVuWT6jfvSQ4LZRVp9LUJEAak
s/EPujfPjzCwjyUSlTEoavqKeE50evlYHBbPRmnIkNX8A731YBUDjzsCgYEAwOgO
oXlG9OpbsgMJeIJnI1XVs1VdwMY43nyR/QMrMT4xOGHfV/OoGDGXeCukBVy+IRDD
IqqQr+VWqSiT4cHabPhIkZBdG/2KTpB5BCEB2F6tk5rwENvjwZK9xxgda5cIRtAG
D3ZtIAAt/u4A4984hNMWbxYxdIzlHKe5s4o9sk8CgYBqZMN5NX2UBcWMvD2lyHZq
LYOwRf/WrZutIbxcNcxBRkq6ftQHJ1I1QRVURcDpbROyWFZEO8E48p2ewGOFlGZ3
gk6gpliEAoS0GRjGaLWtcq85zvllsq70T8ZQJZ23MqMmZrTfD23/B2DCQORNVnGA
gK46s0vocsWUg6h3eBnCBwKBgElXsUBZUM4LUIOUvgQQaFA58T72pOeHNdX5PLQa
gVB+mc4bAAR7ghx4tmMdDIZxZWRC8D385XfK1TEJWXhK8NXfbA/T+GKM+gm2yhv0
xLPUA2CMVtvCDozpUrgghgcC7EWoD7XPS9wP1W0IZlQ86Usuyme/41uxueY0KtmF
JMHnAoGAMoe8dK1ogE+AYJo1mrYDAix+BABWIzKVo5R9rNsL8Zz+2s3BYqeseJhJ
EBSelBVMr1uNuf4SEcClR5FwCCyUMI5it7neqzuGQRn3irJKXKUM/X4hL29DkMWL
VBC+5IW3gHgHhKBkw1lXufgeqmA4vW8QDgmprlLEDPbJ6Jv9+sE=
-----END RSA PRIVATE KEY-----`;

const encPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-256-CBC,11700DD751B21F062EF0BA376F720FBB

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
-----END RSA PRIVATE KEY-----`;
