import React, { useState, useMemo, ComponentType, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAssetConfig, derivableAssets } from '@fireblocks/asset-config';
import { Box, Typography, Breadcrumbs } from '@mui/material';
import { GridToolbarQuickFilter, GridActionsCellItem, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { Add, NavigateNext } from '@mui/icons-material';
import { Derivation } from '@fireblocks/wallet-derivation';
import { VaultAccount } from '../../../../types';
import { RecoverWalletModal } from '../../../../components/Modals/RecoverWalletModal';
import { AddressesModal } from '../../../../components/Modals/AddressesModal';
import { KeysModal } from '../../../../components/Modals/KeysModal';
import { Button } from '../../../../components/Button';
import { DataGrid } from '../../../../components/DataGrid';
import { Link } from '../../../../components/Link';
import { VaultAccountIcon, AssetIcon, WithdrawIcon, DepositAddressesIcon, KeyIcon } from '../../../../components/Icons';
import { ErrorModal } from '../../../../components';

export type Row = {
  assetId: string;
  balance?: number;
  derivations: Derivation[];
};

type GridToolbarProps = {
  isAddWalletDisabled: boolean;
  onClickAddWallet: VoidFunction;
};

function GridToolbar({ isAddWalletDisabled, onClickAddWallet }: GridToolbarProps) {
  return (
    <>
      <GridToolbarQuickFilter
        placeholder='Asset or Address'
        variant='outlined'
        sx={{
          minWidth: '250px',
          backgroundColor: 'rgba(84, 83, 96, 0.1)',
          padding: '0 8px',
          borderRadius: '24px',
          '& .MuiInputBase-root': {
            padding: 0,
          },
          '& .MuiInputBase-input': {
            padding: 0,
          },
          '& fieldset': {
            display: 'none',
          },
        }}
      />
      <Box>
        {/* <Button variant="text" size="small" sx={{ marginRight: "1rem" }}>
        Get Balance
      </Button> */}
        <Button variant='outlined' size='small' startIcon={<Add />} disabled={isAddWalletDisabled} onClick={onClickAddWallet}>
          Asset Wallet
        </Button>
      </Box>
    </>
  );
}

type Props = {
  account?: VaultAccount;
  withdrawModal?: ComponentType<{ assetId?: string; accountId?: number; open: boolean; onClose: VoidFunction }>;
  addWallet: (assetId: string, accountId: number) => void;
};

export const VaultAccountBasePage = ({ account, withdrawModal: WithdrawModal, addWallet }: Props) => {
  const router = useRouter();

  const [derivationError, setDerivationError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!account) {
      router.push('/accounts/vault');
    }
  }, [account, router]);

  const assetsNotInAccount = useMemo(() => {
    const assetsInAccount = account?.wallets.size
      ? Array.from(account.wallets.keys()).map(
          (assetId) =>
            getAssetConfig(assetId) ?? {
              id: assetId,
              name: assetId,
              nativeAsset: assetId,
              decimals: 18,
            },
        )
      : [];

    const otherAssets = [...derivableAssets]
      .filter((asset) => !assetsInAccount.some((assetInVault) => assetInVault.id === asset.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return otherAssets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isRestoreWalletModalOpen, setIsRestoreWalletModalOpen] = useState(false);

  const handleOpenRestoreWalletModal = () => setIsRestoreWalletModalOpen(true);
  const handleCloseRestoreWalletModal = () => setIsRestoreWalletModalOpen(false);

  const [addressesModalRow, setAddressesModalRow] = useState<Row | null>(null);

  const handleOpenAddressesModal = (row: Row) => setAddressesModalRow(row);
  const handleCloseAddressesModal = () => setAddressesModalRow(null);

  const [keysModalRow, setKeysModalRow] = useState<Row | null>(null);

  const handleOpenKeysModal = (row: Row) => setKeysModalRow(row);
  const handleCloseKeysModal = () => setKeysModalRow(null);

  const [withdrawalAssetId, setWithdrawalAssetId] = useState<string | undefined>(undefined);

  const handleOpenWithdrawModal = (assetId: string) => setWithdrawalAssetId(assetId);
  const handleCloseWithdrawModal = () => setWithdrawalAssetId(undefined);

  const columns = useMemo<GridColDef<Row>[]>(
    () => [
      {
        field: 'icon',
        headerName: 'Icon',
        width: 60,
        sortable: false,
        filterable: false,
        renderHeader: () => null,
        renderCell: (params) => (
          <Box
            width={40}
            height={40}
            display='flex'
            alignItems='center'
            justifyContent='center'
            border={(theme) => `solid 1px ${theme.palette.grey[200]}`}
            borderRadius={40}
          >
            <AssetIcon assetId={params.row.assetId} />
          </Box>
        ),
      },
      {
        field: 'assetId',
        headerName: 'Asset',
        flex: 1,
        sortable: true,
        filterable: true,
        getApplyQuickFilterFn: (search: string) => {
          const lowercaseSearch = search.toLowerCase();

          return (params) => {
            const { assetId } = params.row;

            return !!(
              assetId.toLowerCase().includes(lowercaseSearch) ||
              getAssetConfig(assetId)?.name.toLowerCase().includes(lowercaseSearch)
            );
          };
        },
      },
      {
        field: 'derivations',
        headerName: 'Derivations',
        sortable: false,
        filterable: false,
        getApplyQuickFilterFn: (search: string) => {
          const lowercaseSearch = search.toLowerCase();

          return (params) => params.row.derivations.some((derivation) => derivation.address.toLowerCase() === lowercaseSearch);
        },
      },
      {
        field: 'actions',
        type: 'actions',
        width: 126,
        getActions: (params) => {
          const actions = [
            <GridActionsCellItem
              key={`addresses-${params.id}`}
              icon={<DepositAddressesIcon />}
              label='Addresses'
              onClick={() => handleOpenAddressesModal(params.row)}
              disabled={!params.row.derivations?.length}
            />,
            <GridActionsCellItem
              key={`keys-${params.id}`}
              icon={<KeyIcon />}
              label='Keys'
              onClick={() => handleOpenKeysModal(params.row)}
              disabled={!params.row.derivations?.some((derivation) => derivation.publicKey)}
            />,
          ];

          if (WithdrawModal) {
            actions.push(
              <GridActionsCellItem
                key={`withdraw-${params.id}`}
                icon={<WithdrawIcon />}
                label='Withdraw'
                onClick={() => handleOpenWithdrawModal(params.row.assetId)}
                disabled={!params.row.derivations?.some((derivation) => derivation.publicKey)}
              />,
            );
          }

          return actions;
        },
      },
    ],
    [],
  );

  const rows: GridRowsProp<Row> = account
    ? Array.from(account.wallets).map(([assetId, wallet]) => ({
        assetId,
        balance: wallet.balance?.native,
        derivations: Array.from(wallet.derivations).map(([, derivation]) => derivation),
      }))
    : [];

  return (
    <>
      <DataGrid<Row>
        heading={
          <>
            <Typography variant='h1'>Accounts</Typography>
            <Breadcrumbs separator={<NavigateNext />} sx={{ minHeight: '48px', display: 'flex', alignItems: 'center' }}>
              <Link href='/accounts/vault' underline='none'>
                <Typography variant='h2' fontWeight='normal'>
                  My Vault
                </Typography>
              </Link>
              <Typography variant='h2' display='flex' alignItems='center'>
                <Box
                  marginRight='0.5em'
                  width={32}
                  height={32}
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  border={(theme) => `solid 1px ${theme.palette.grey[200]}`}
                  sx={{ background: '#FFF' }}
                >
                  <VaultAccountIcon color='primary' sx={{ fontSize: '19px' }} />
                </Box>
                {account?.name}{' '}
                <Typography fontWeight={400} marginLeft='0.5em'>
                  (ID {account?.id})
                </Typography>
              </Typography>
            </Breadcrumbs>
          </>
        }
        getRowId={(row) => row.assetId}
        rows={rows}
        columns={columns}
        componentsProps={{
          toolbar: {
            children: (
              <GridToolbar isAddWalletDisabled={!assetsNotInAccount.length} onClickAddWallet={handleOpenRestoreWalletModal} />
            ),
          },
        }}
        disableColumnMenu
        columnVisibilityModel={{ derivations: false }}
        initialState={{
          sorting: {
            sortModel: [{ field: 'assetId', sort: 'asc' }],
          },
        }}
      />
      <RecoverWalletModal
        assetsNotInAccount={assetsNotInAccount}
        account={account}
        open={isRestoreWalletModalOpen}
        onClose={handleCloseRestoreWalletModal}
        addWallet={addWallet}
        setDerivationError={setDerivationError}
      />
      <AddressesModal open={!!addressesModalRow} row={addressesModalRow} onClose={handleCloseAddressesModal} />
      <KeysModal open={!!keysModalRow} row={keysModalRow} onClose={handleCloseKeysModal} />
      {!!WithdrawModal && (
        <WithdrawModal
          key={`${account?.id ?? '?'}-${withdrawalAssetId}`}
          assetId={withdrawalAssetId}
          accountId={account?.id}
          open={typeof withdrawalAssetId === 'string'}
          onClose={handleCloseWithdrawModal}
        />
      )}
      <ErrorModal
        open={derivationError !== undefined}
        onClose={() => setDerivationError(undefined)}
        title='Add Wallet Failed'
        error={derivationError as string}
      />
    </>
  );
};
