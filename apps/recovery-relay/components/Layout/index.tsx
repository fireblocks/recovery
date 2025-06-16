import { ReactNode } from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { LeakAdd, ImportExport, Settings } from '@mui/icons-material';
import DrawIcon from '@mui/icons-material/Draw';
import semver from 'semver';
import {
  Layout as BaseLayout,
  LayoutProps as BaseLayoutProps,
  AccountsIcon,
  RelayRequestParams,
  useOfflineQuery,
} from '@fireblocks/recovery-shared';
import packageJson from '../../package.json';
import { useWorkspace } from '../../context/Workspace';
import { WithdrawModal } from '../WithdrawModal';

const getWithdrawModalKey = (inboundRelayParams?: RelayRequestParams) => {
  switch (inboundRelayParams?.action) {
    case 'tx/create':
      return inboundRelayParams.newTx.assetId;
    case 'tx/broadcast':
      return inboundRelayParams.signedTx.assetId;
    default:
      return undefined;
  }
};

type Props = {
  children: ReactNode;
};

export const Layout = ({ children }: Props) => {
  const { extendedKeys: { xpub, fpub } = {}, inboundRelayParams } = useWorkspace();

  const hasExtendedPublicKeys = !!xpub || !!fpub;

  const versionQuery = useOfflineQuery({
    enabled: true,
    queryKey: ['utilityReleasesUrl'],
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryFn: async () => {
      const latestPackageJson = (await (
        await fetch(
          packageJson.repository
            .replace('recovery-relay', 'recovery-utility/package.json')
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('tree', ''),
        )
      ).json()) as typeof packageJson;

      return latestPackageJson.version;
    },
  });

  const navLinks: BaseLayoutProps['navLinks'] = [
    {
      label: 'Accounts',
      path: '/accounts/vault',
      icon: AccountsIcon,
      disabled: !hasExtendedPublicKeys,
    },
    {
      label: 'Relay',
      path: '/relay',
      icon: LeakAdd,
    },
    {
      label: 'Import / Export',
      path: '/csv',
      icon: ImportExport,
      disabled: !hasExtendedPublicKeys,
    },
    {
      label: 'Raw Signing',
      path: '/raw-signing',
      icon: DrawIcon,
      disabled: !hasExtendedPublicKeys,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
    // {
    //   label: 'Settings',
    //   path: '/settings',
    //   icon: Settings,
    // },
  ];

  return (
    <BaseLayout
      title='Recovery Relay'
      description='Query balances and send transactions from your recovered Fireblocks wallets'
      navLinks={navLinks}
    >
      {!!versionQuery.data && semver.gt(versionQuery.data, packageJson.version) && (
        <Alert severity='error'>
          <AlertTitle style={{ lineHeight: undefined, marginBottom: 0, marginTop: 0 }}>
            Version {versionQuery.data} is available, please update
          </AlertTitle>
        </Alert>
      )}
      {children}
      <WithdrawModal key={getWithdrawModalKey(inboundRelayParams)} />
    </BaseLayout>
  );
};
