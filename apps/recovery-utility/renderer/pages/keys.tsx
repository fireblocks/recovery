import { ExtendedKeysBasePage } from '../components/Pages/keys';
import { useWorkspace } from '../context/Workspace';

const ExtendedKeys = () => {
  const { extendedKeys } = useWorkspace();

  return <ExtendedKeysBasePage supportsPrivateKeys extendedKeys={extendedKeys} />;
};

export default ExtendedKeys;
