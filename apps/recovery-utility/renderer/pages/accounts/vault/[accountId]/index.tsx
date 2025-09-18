import { VaultAccountBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../../../../context/Workspace';
import { WithdrawModal } from '../../../../components/Modals/WithdrawModal';

const VaultAccount = () => {
  const { account, addWallet, getExtendedKeysForAccountId } = useWorkspace();

  const { xprv, fprv } = getExtendedKeysForAccountId(account?.id || 0) || {};
  const hasExtendedPrivateKeys = !!xprv && !!fprv;

  return (
    <VaultAccountBasePage
      account={account}
      withdrawModal={hasExtendedPrivateKeys ? WithdrawModal : undefined}
      addWallet={addWallet}
    />
  );
};

export default VaultAccount;
