import { ExtendedKeysBasePage } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../context/Workspace';

const ExtendedKeys = () => {
  const { extendedKeys, setExtendedKeys } = useWorkspace();

  return <ExtendedKeysBasePage supportsPrivateKeys extendedKeys={extendedKeys} setExtendedKeys={setExtendedKeys} />;
};

export default ExtendedKeys;
