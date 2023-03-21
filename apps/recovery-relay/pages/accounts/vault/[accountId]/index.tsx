import { VaultAccountBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../../../../context/Workspace';

const VaultAccount = () => {
  const { account, addWallet } = useWorkspace();

  return <VaultAccountBasePage account={account} addWallet={addWallet} />;
};

export default VaultAccount;
