import { VaultAccountBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../../../../context/Workspace';
import { WithdrawModal } from '../../../../components/Modals/WithdrawModal';

const VaultAccount = () => {
  const { extendedKeys, account, addWallet } = useWorkspace();

  const hasExtendedPrivateKeys = !!extendedKeys?.xprv && !!extendedKeys?.fprv;

  return (
    <VaultAccountBasePage
      account={account}
      withdrawModal={hasExtendedPrivateKeys ? WithdrawModal : undefined}
      addWallet={addWallet}
    />
  );
};

export default VaultAccount;
