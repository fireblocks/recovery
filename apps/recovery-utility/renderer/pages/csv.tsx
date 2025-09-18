import { ImportExportBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../context/Workspace';

const ImportExport = () => {
  const { accounts, importCsv, getExtendedKeysForAccountId } = useWorkspace();

  // Since we expect there to be at least 1 keyset which is associated to account 0, this is a good substitution
  return <ImportExportBasePage extendedKeys={getExtendedKeysForAccountId(0)} accounts={accounts} importCsv={importCsv} />;
};

export default ImportExport;
