import { useRouter } from 'next/router';
import React, { ComponentType, useMemo } from 'react';
import { Box, Grid, Typography, Breadcrumbs } from '@mui/material';
import { GridToolbarQuickFilter, GridActionsCellItem, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { VaultAccount } from '../../../types';
import { ExtendedKeys } from '../../../schemas';
import { RecoverAccountModal } from '../../../components/Modals/RecoverAccountModal';
import { Button } from '../../../components/Button';
import { DataGrid } from '../../../components/DataGrid';
import { NextLinkComposed } from '../../../components/Link';
import { VaultAccountIcon, WithdrawIcon } from '../../../components/Icons';
import { useWrappedState } from '../../../lib/debugUtils';

type Row = {
  accountId: number;
  name: string;
  addresses: string[];
};

type GridToolbarProps = {
  onClickAddAccount: VoidFunction;
};

function GridToolbar({ onClickAddAccount }: GridToolbarProps) {
  return (
    <>
      <GridToolbarQuickFilter
        placeholder='Account Name or Address'
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
        <Button variant='outlined' size='small' startIcon={<Add />} onClick={onClickAddAccount}>
          Vault Account
        </Button>
      </Box>
    </>
  );
}

type Props = {
  extendedKeys?: ExtendedKeys;
  accounts: Map<number, VaultAccount>;
  addAccount: (name: string, id?: number) => number;
  withdrawModal?: ComponentType<{
    accountId: number;
    assetId?: string;
    open: boolean;
    onClose: VoidFunction;
  }>;
};

export const VaultBasePage = ({ extendedKeys, accounts, addAccount, withdrawModal: WithdrawModal }: Props) => {
  const router = useRouter();

  const [isRecoverAccountModalOpen, setIsRecoverAccountModalOpen] = useWrappedState<boolean>(
    'vaultBase-isRecoverAccountModalOpen',
    false,
  );

  const handleOpenRecoverAccountModal = () => setIsRecoverAccountModalOpen(true);
  const handleCloseRecoverAccountModal = () => setIsRecoverAccountModalOpen(false);

  const [withdrawalAccountId, setWithdrawalAccountId] = useWrappedState<number | undefined>(
    'vaultBase-withdrawalAccountId',
    undefined,
  );

  const handleOpenWithdrawModal = (_accountId: number) => setWithdrawalAccountId(_accountId);
  const handleCloseWithdrawModal = () => setWithdrawalAccountId(undefined);

  const columns = useMemo(() => {
    const cols: GridColDef<Row>[] = [
      {
        field: 'icon',
        headerName: 'Icon',
        width: 60,
        sortable: false,
        filterable: false,
        getApplyQuickFilterFn: undefined,
        renderHeader: () => null,
        renderCell: () => (
          <Box
            width={40}
            height={40}
            display='flex'
            alignItems='center'
            justifyContent='center'
            border={(t) => `solid 1px ${t.palette.grey[200]}`}
          >
            <VaultAccountIcon color='primary' />
          </Box>
        ),
      },
      {
        field: 'accountId',
        headerName: 'ID',
        sortable: true,
        filterable: false,
        getApplyQuickFilterFn: undefined,
      },
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        sortable: true,
        filterable: true,
        getApplyQuickFilterFn: (search: string) => (params) => params.row.name.toLowerCase().includes(search.toLowerCase()),
      },
      {
        field: 'addresses',
        headerName: 'Addresses',
        sortable: false,
        filterable: false,
        getApplyQuickFilterFn: (search: string) => (params) =>
          params.row.addresses.some((address) => address.toLowerCase() === search.toLowerCase()),
      },
    ];

    if (WithdrawModal) {
      cols.push({
        field: 'actions',
        type: 'actions',
        width: 50,
        getActions: (params) => [
          <GridActionsCellItem
            key={`withdraw-${params.id}`}
            icon={<WithdrawIcon />}
            label='Withdraw'
            disabled={!params.row.addresses.length}
            onClick={() => handleOpenWithdrawModal(params.row.accountId)}
          />,
        ],
      });
    }

    return cols;
  }, []);

  const rows = useMemo<GridRowsProp<Row>>(
    () =>
      Array.from(accounts).map(([accountId, account]) => ({
        accountId,
        name: account.name,
        addresses: Array.from(account.wallets)
          .flatMap(([, wallet]) => Array.from(wallet.derivations))
          .map(([, derivation]) => derivation.address),
      })),
    [accounts],
  );

  return (
    <>
      {accounts.size ? (
        <DataGrid<Row>
          heading={
            <>
              <Typography variant='h1'>Accounts</Typography>
              <Breadcrumbs
                sx={{
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography variant='h2'>My Vault</Typography>
              </Breadcrumbs>
            </>
          }
          getRowId={(row) => row.accountId}
          rows={rows}
          columns={columns}
          componentsProps={{
            toolbar: {
              children: <GridToolbar onClickAddAccount={handleOpenRecoverAccountModal} />,
            },
          }}
          disableColumnMenu
          columnVisibilityModel={{ accountId: false, addresses: false }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
          onRowClick={(params) =>
            router.push({
              pathname: `/accounts/vault/[accountId]`,
              query: { accountId: params.id },
            })
          }
        />
      ) : (
        <Grid container spacing={2} flexDirection='column' alignItems='center' justifyContent='center' height='100%'>
          <Grid item>
            <VaultAccountIcon color='primary' sx={{ fontSize: '5em' }} />
          </Grid>
          <Grid item>
            <Typography variant='h1'>Vault Accounts</Typography>
          </Grid>
          <Grid item>
            <Typography paragraph variant='body1' textAlign='center'>
              Verify or recover your Recovery Kit or extended keys to recreate vault accounts and wallets.
            </Typography>
          </Grid>
          <Grid item>
            {!!extendedKeys?.xpub && !!extendedKeys.fpub ? (
              <Button startIcon={<Add />} onClick={handleOpenRecoverAccountModal}>
                Vault Account
              </Button>
            ) : (
              <Button component={NextLinkComposed} to='/'>
                Verify or Recover
              </Button>
            )}
          </Grid>
        </Grid>
      )}
      <RecoverAccountModal open={isRecoverAccountModalOpen} onClose={handleCloseRecoverAccountModal} addAccount={addAccount} />
      {!!WithdrawModal && (
        <WithdrawModal
          key={withdrawalAccountId}
          accountId={withdrawalAccountId ?? 0}
          open={typeof withdrawalAccountId === 'number'}
          onClose={handleCloseWithdrawModal}
        />
      )}
    </>
  );
};
