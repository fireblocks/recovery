import { VaultBasePage } from '@fireblocks/recovery-shared';
import { RecoveredKey } from '@fireblocks/extended-key-recovery/src/types';
import { useWorkspace } from '../../../context/Workspace';
import { WithdrawModal } from '../../../components/Modals/WithdrawModal';

const Vault = () => {
  const { extendedKeys, accounts, addAccount, getExtendedKeysForAccountId } = useWorkspace();

  const { xprv, fprv, xpub, fpub } = getExtendedKeysForAccountId(0) || {};
  const hasExtendedPrivateKeys = !!xprv && !!fprv;

  const totalKeysetCount = Object.keys(extendedKeys || {}).filter(
    (keysetId) => !['xpub', 'xprv', 'fprv', 'fpub', 'ncwMaster'].includes(keysetId),
  ).length;

  const totalUnmappedKeysets = Object.entries(extendedKeys || {}).filter(([keysetId, value]) => {
    if (['xpub', 'xprv', 'fprv', 'fpub', 'ncwMaster'].includes(keysetId)) {
      return false;
    }
    let res = false;
    const key = value as RecoveredKey;
    if (key.eddsaExists) {
      res = res || key.eddsaMinAccount === -1;
    }
    if (key.ecdsaExists) {
      res = res || key.ecdsaMinAccount === -1;
    }
    return res;
  }).length;

  const hasMultipleKeysets = totalKeysetCount > 1 && totalUnmappedKeysets > 0;

  const totalEcdsaCount = Object.entries(extendedKeys || {}).filter(
    ([keysetId, value]) =>
      !['xpub', 'xprv', 'fprv', 'fpub', 'ncwMaster'].includes(keysetId) && (value as RecoveredKey).ecdsaExists,
  ).length;
  const totalEddsaCount = Object.entries(extendedKeys || {}).filter(
    ([keysetId, value]) =>
      !['xpub', 'xprv', 'fprv', 'fpub', 'ncwMaster'].includes(keysetId) && (value as RecoveredKey).eddsaExists,
  ).length;

  const firstUnmappedECDSAIndex = Object.entries(extendedKeys || {}).findLast(
    ([keysetId, value]) =>
      !['xpub', 'xprv', 'fprv', 'fpub', 'ncwMaster'].includes(keysetId) &&
      (value as RecoveredKey).ecdsaExists &&
      (value as RecoveredKey).ecdsaMinAccount !== -1,
  );

  const firstUnmappedEddsaIndex = Object.entries(extendedKeys || {}).findLast(
    ([keysetId, value]) =>
      !['xpub', 'xprv', 'fprv', 'fpub', 'ncwMaster'].includes(keysetId) &&
      (value as RecoveredKey).eddsaExists &&
      (value as RecoveredKey).eddsaMinAccount !== -1,
  );

  return (
    <VaultBasePage
      extendedKeys={{ xprv, fprv, xpub, fpub }}
      accounts={accounts}
      addAccount={addAccount}
      hasMultipleKeysets={hasMultipleKeysets}
      totalKeysetCount={[totalEcdsaCount, totalEddsaCount]}
      currentKeysetIndex={[Number(firstUnmappedECDSAIndex?.[0]), Number(firstUnmappedEddsaIndex?.[0])]}
      withdrawModal={hasExtendedPrivateKeys ? WithdrawModal : undefined}
    />
  );
};

export default Vault;
