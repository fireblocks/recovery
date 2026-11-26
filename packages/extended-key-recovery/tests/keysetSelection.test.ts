import { tryGetRecoveredKeyForKeyset } from '../src/recover';
import { CalculatedPrivateKeysets } from '../src/types';

// Covers the selector that picks which reconstructed algorithm surfaces in the UI per
// keyset. reconstructKeys() can recover several algorithms for the same keyset (e.g. CMP
// and BAM share a keyset when a wallet is re-split for 2-party signing); this selector
// decides which one wins.
describe('tryGetRecoveredKeyForKeyset', () => {
  const cmpEcdsa = { prvKey: 'cmp-ecdsa-prv', pubKey: 'cmp-ecdsa-pub', chainCode: 'cc' };
  const bamEcdsa = { prvKey: 'bam-ecdsa-prv', pubKey: 'bam-ecdsa-pub', chainCode: 'cc' };
  const cmpEddsa = { prvKey: 'cmp-eddsa-prv', pubKey: 'cmp-eddsa-pub', chainCode: 'cc' };
  const frostEddsa = { prvKey: 'frost-eddsa-prv', pubKey: 'frost-eddsa-pub', chainCode: 'cc' };

  it('surfaces the BAM key when a keyset holds only a 2-party ECDSA share', () => {
    const keysets: CalculatedPrivateKeysets = {
      1: { MPC_BAM_ECDSA_SECP256K1: bamEcdsa },
    };

    const [exists, prvKey, pubKey] = tryGetRecoveredKeyForKeyset(keysets, 1, true);

    expect(exists).toBe(true);
    expect(prvKey).toEqual(bamEcdsa.prvKey);
    expect(pubKey).toEqual(bamEcdsa.pubKey);
  });

  it('surfaces the FROST key when a keyset holds only a 2-party EdDSA share', () => {
    const keysets: CalculatedPrivateKeysets = {
      1: { MPC_FROST_EDDSA_ED25519: frostEddsa },
    };

    const [exists, prvKey, pubKey] = tryGetRecoveredKeyForKeyset(keysets, 1, false);

    expect(exists).toBe(true);
    expect(prvKey).toEqual(frostEddsa.prvKey);
    expect(pubKey).toEqual(frostEddsa.pubKey);
  });

  it('prefers CMP over BAM when a keyset holds both', () => {
    const keysets: CalculatedPrivateKeysets = {
      1: { MPC_CMP_ECDSA_SECP256K1: cmpEcdsa, MPC_BAM_ECDSA_SECP256K1: bamEcdsa },
    };

    const [, prvKey] = tryGetRecoveredKeyForKeyset(keysets, 1, true);

    expect(prvKey).toEqual(cmpEcdsa.prvKey);
  });

  it('prefers CMP over FROST when a keyset holds both', () => {
    const keysets: CalculatedPrivateKeysets = {
      1: { MPC_CMP_EDDSA_ED25519: cmpEddsa, MPC_FROST_EDDSA_ED25519: frostEddsa },
    };

    const [, prvKey] = tryGetRecoveredKeyForKeyset(keysets, 1, false);

    expect(prvKey).toEqual(cmpEddsa.prvKey);
  });

  it('reports no key found when the keyset is entirely absent', () => {
    const [exists, prvKey, pubKey, chainCode] = tryGetRecoveredKeyForKeyset({}, 1, true);

    expect(exists).toBe(false);
    expect(prvKey).toBeUndefined();
    expect(pubKey).toBeUndefined();
    expect(chainCode).toBeUndefined();
  });
});
