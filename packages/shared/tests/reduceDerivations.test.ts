import { RecoveredKey } from '@fireblocks/extended-key-recovery/src/types';
import { reduceDerivations } from '../hooks/useBaseWorkspace/reduceDerivations';

// Covers the gate that decides whether a wallet is even attempted for derivation. A kit
// can legitimately hold only an ECDSA key (e.g. BAM-only) or only an EdDSA key (e.g.
// FROST-only) — this must not block deriving the curve that IS available.
describe('reduceDerivations', () => {
  const ecdsaOnlyKey: RecoveredKey = {
    xpub: 'xpub-fake',
    xprv: 'xprv-fake',
    ecdsaExists: true,
    eddsaExists: false,
    ecdsaMinAccount: 0,
    eddsaMinAccount: -1,
  };

  const eddsaOnlyKey: RecoveredKey = {
    fpub: 'fpub-fake',
    fprv: 'fprv-fake',
    ecdsaExists: false,
    eddsaExists: true,
    ecdsaMinAccount: -1,
    eddsaMinAccount: 0,
  };

  const bothCurvesKey: RecoveredKey = {
    xpub: 'xpub-fake',
    xprv: 'xprv-fake',
    fpub: 'fpub-fake',
    fprv: 'fprv-fake',
    ecdsaExists: true,
    eddsaExists: true,
    ecdsaMinAccount: 0,
    eddsaMinAccount: 0,
  };

  const fakeDerivation = (assetId: string, address: string) => ({ assetId, address, path: {} } as any);

  it('derives an ECDSA asset when only an ECDSA key exists (e.g. a BAM-only kit)', () => {
    const deriveWallet = jest.fn().mockReturnValue(fakeDerivation('ETH', '0xabc'));

    const account = reduceDerivations({
      extendedKeys: { 1: ecdsaOnlyKey } as any,
      accounts: new Map(),
      assetId: 'ETH',
      accountId: 0,
      deriveWallet,
    });

    expect(deriveWallet).toHaveBeenCalled();
    expect(account.wallets.get('ETH')?.derivations.size).toBeGreaterThan(0);
  });

  it('derives an EdDSA asset when only an EdDSA key exists (e.g. a FROST-only kit)', () => {
    const deriveWallet = jest.fn().mockReturnValue(fakeDerivation('SOL', 'fakeSolAddress'));

    const account = reduceDerivations({
      extendedKeys: { 1: eddsaOnlyKey } as any,
      accounts: new Map(),
      assetId: 'SOL',
      accountId: 0,
      deriveWallet,
    });

    expect(deriveWallet).toHaveBeenCalled();
    expect(account.wallets.get('SOL')?.derivations.size).toBeGreaterThan(0);
  });

  it('still derives when both curves exist (unchanged behavior)', () => {
    const deriveWallet = jest.fn().mockReturnValue(fakeDerivation('ETH', '0xabc'));

    const account = reduceDerivations({
      extendedKeys: { 1: bothCurvesKey } as any,
      accounts: new Map(),
      assetId: 'ETH',
      accountId: 0,
      deriveWallet,
    });

    expect(deriveWallet).toHaveBeenCalled();
    expect(account.wallets.get('ETH')?.derivations.size).toBeGreaterThan(0);
  });

  it('does not attempt derivation when neither curve key exists', () => {
    const deriveWallet = jest.fn();

    const account = reduceDerivations({
      extendedKeys: {} as any,
      accounts: new Map(),
      assetId: 'ETH',
      accountId: 0,
      deriveWallet,
    });

    expect(deriveWallet).not.toHaveBeenCalled();
    expect(account.wallets.get('ETH')?.derivations.size ?? 0).toBe(0);
  });

  it("keeps an imported address when the kit only has the other curve's key", () => {
    // e.g. a CSV import of a SOL address into a BAM-only (ECDSA-only) kit. BaseWallet
    // correctly throws for the missing EdDSA key — that must not wipe out the address
    // the user already imported.
    const deriveWallet = jest.fn(() => {
      throw new Error('This recovery kit has no EDDSA key, so SOL cannot be derived');
    });

    const account = reduceDerivations({
      extendedKeys: { 1: ecdsaOnlyKey } as any,
      accounts: new Map(),
      assetId: 'SOL',
      accountId: 0,
      address: 'imported-sol-address',
      deriveWallet,
    });

    expect(deriveWallet).toHaveBeenCalled();
    expect(account.wallets.get('SOL')?.derivations.get('SOL-imported-sol-address')).toBeDefined();
  });

  it('keeps an imported BTC address when the alternative (legacy/segwit) derivation also fails', () => {
    // e.g. a BTC CSV import into a FROST-only (EdDSA-only) kit: both the primary and the
    // alternative-format derivation throw for the missing ECDSA key. Neither may abort the
    // account or drop the imported address.
    const deriveWallet = jest.fn(() => {
      throw new Error('This recovery kit has no ECDSA key, so BTC cannot be derived');
    });

    const account = reduceDerivations({
      extendedKeys: { 1: eddsaOnlyKey } as any,
      accounts: new Map(),
      assetId: 'BTC',
      accountId: 0,
      address: 'imported-btc-address',
      deriveWallet,
    });

    expect(deriveWallet).toHaveBeenCalledTimes(2);
    expect(account.wallets.get('BTC')?.derivations.get('BTC-imported-btc-address')).toBeDefined();
  });

  it('surfaces the derivation error when nothing was imported (e.g. adding ETH to an EdDSA-only kit)', () => {
    const deriveWallet = jest.fn(() => {
      throw new Error('This recovery kit has no ECDSA key, so ETH cannot be derived');
    });

    expect(() =>
      reduceDerivations({
        extendedKeys: { 1: eddsaOnlyKey } as any,
        accounts: new Map(),
        assetId: 'ETH',
        accountId: 0,
        deriveWallet,
      }),
    ).toThrow('This recovery kit has no ECDSA key, so ETH cannot be derived');
  });

  it('derives the missing private key of an imported row from the EdDSA keyset fprv', () => {
    // The keyset has no xprv, so the missing private key can only come from fprv.
    const deriveWallet = jest.fn().mockReturnValue(fakeDerivation('SOL', 'imported-sol-address'));

    reduceDerivations({
      extendedKeys: { 1: eddsaOnlyKey } as any,
      accounts: new Map(),
      assetId: 'SOL',
      accountId: 0,
      address: 'imported-sol-address',
      publicKey: 'imported-sol-public-key',
      deriveWallet,
    });

    expect(deriveWallet).toHaveBeenCalledTimes(1);
  });
});
