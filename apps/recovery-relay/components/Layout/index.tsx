import { ReactNode } from 'react';
import { Verified, LeakAdd, ImportExport /* Settings */ } from '@mui/icons-material';
import {
  Layout as BaseLayout,
  LayoutProps as BaseLayoutProps,
  StatusBoxProps,
  AccountsIcon,
  RelayRequestParams,
} from '@fireblocks/recovery-shared';
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

  let status: StatusBoxProps | undefined;

  if (hasExtendedPublicKeys) {
    status = { icon: Verified, text: 'Extended public keys set' };
  }

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
      status={status}
    >
      {children}
      <WithdrawModal key={getWithdrawModalKey(inboundRelayParams)} />;
    </BaseLayout>
  );
};
