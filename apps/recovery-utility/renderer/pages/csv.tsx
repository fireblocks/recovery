import { ImportExportBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../context/Workspace';

const ImportExport = () => {
  const { extendedKeys, accounts, importCsv } = useWorkspace();

  return <ImportExportBasePage extendedKeys={extendedKeys} accounts={accounts} importCsv={importCsv} />;
};

export default ImportExport;
