import { VaultBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../../../context/Workspace';
// import { WithdrawModal } from '../../../components/Modals/WithdrawModal';

const WithdrawModal = () => null;

const Vault = () => {
  const { extendedKeys, accounts, addAccount } = useWorkspace();

  return <VaultBasePage extendedKeys={extendedKeys} accounts={accounts} addAccount={addAccount} withdrawModal={WithdrawModal} />;
};

export default Vault;
