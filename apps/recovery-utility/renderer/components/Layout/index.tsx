import { ReactNode, useEffect } from 'react';
import { Report, Restore, Verified, /* LeakAdd, */ ImportExport, ManageHistory, Settings } from '@mui/icons-material';
import DrawIcon from '@mui/icons-material/Draw';
import {
  Layout as BaseLayout,
  LayoutProps as BaseLayoutProps,
  StatusBoxProps,
  AccountsIcon,
  KeyIcon,
  getLogger,
  useWrappedState,
} from '@fireblocks/recovery-shared';
import { useConnectionTest } from '../../context/ConnectionTest';
import { useWorkspace } from '../../context/Workspace';
import { getDeployment } from '../../lib/ipc';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';

type Props = {
  children: ReactNode;
};

const logger = getLogger(LOGGER_NAME_UTILITY);

export const Layout = ({ children }: Props) => {
  const { isOnline } = useConnectionTest();

  const { extendedKeys: { ncwMaster } = {}, getExtendedKeysForAccountId } = useWorkspace();

  const [protocol, setProtocol] = useWrappedState<'UTILITY' | 'RELAY' | null>('protocol', null);

  useEffect(
    () =>
      void getDeployment().then((deployment) => {
        setProtocol(deployment.protocol);
      }),
    [],
  );

  const { xpub, fpub, xprv, fprv } = getExtendedKeysForAccountId(0) || {};
  const hasExtendedPrivateKeys = !!xprv || !!fprv;
  const hasExtendedPublicKeys = !!xpub || !!fpub;
  const hasOnlyExtendedPublicKeys = hasExtendedPublicKeys && !hasExtendedPrivateKeys;
  const hasExtendedKeys = hasExtendedPublicKeys || hasExtendedPrivateKeys;
  const hasNCWMasterKey = !!ncwMaster;

  let status: StatusBoxProps | undefined;

  if (hasExtendedPrivateKeys) {
    status = { icon: Restore, text: 'Recovered private keys' };
  } else if (hasOnlyExtendedPublicKeys) {
    status = { icon: Verified, text: 'Verifying public keys' };
  }

  const navLinks: BaseLayoutProps['navLinks'] = [
    {
      label: 'Accounts',
      path: '/accounts/vault',
      icon: AccountsIcon,
      disabled: !hasExtendedKeys,
    },
    {
      label: 'NCW',
      path: '/ncw',
      disabled: !hasNCWMasterKey,
      icon: AccountsIcon,
    },
    // {
    //   label: 'Relay',
    //   path: '/relay',
    //   icon: LeakAdd,
    //   disabled: !hasExtendedKeys,
    // },
    {
      label: 'Import / Export',
      path: '/csv',
      icon: ImportExport,
      disabled: !hasExtendedKeys,
    },
    {
      label: 'Set Up',
      path: '/setup',
      icon: ManageHistory,
    },
    {
      label: 'Verify',
      path: '/verify',
      icon: Verified,
    },
    {
      label: 'Recover',
      path: '/recover',
      icon: Restore,
      color: 'error',
    },
    {
      label: 'Extended Keys',
      path: '/keys',
      icon: KeyIcon,
    },
    {
      label: 'Raw Signing',
      path: '/raw-signing',
      icon: DrawIcon,
      disabled: !hasExtendedKeys,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <BaseLayout
      title='Recovery Utility'
      description='Recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.'
      navLinks={navLinks}
      isLoaded={!!protocol}
      notice={
        isOnline && protocol === 'UTILITY' ? (
          <>
            <Report sx={{ marginRight: '0.5rem' }} />
            This machine is connected to a network. Please disconnect.
          </>
        ) : undefined
      }
      noticeLevel={isOnline ? 'error' : undefined}
    >
      {children}
    </BaseLayout>
  );
};
