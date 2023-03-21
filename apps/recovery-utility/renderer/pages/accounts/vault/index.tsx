import { VaultBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../../../context/Workspace';
import { WithdrawModal } from '../../../components/Modals/WithdrawModal';

const Vault = () => {
  const { extendedKeys, accounts, addAccount } = useWorkspace();

  const hasExtendedPrivateKeys = !!extendedKeys?.xprv && !!extendedKeys?.fprv;

  return (
    <VaultBasePage
      extendedKeys={extendedKeys}
      accounts={accounts}
      addAccount={addAccount}
      withdrawModal={hasExtendedPrivateKeys ? WithdrawModal : undefined}
    />
  );
};

export default Vault;
