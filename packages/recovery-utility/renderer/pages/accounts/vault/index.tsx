import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../../_app";
import { useMemo, useState } from "react";
import { AssetId, Button } from "@fireblocks/recovery-shared";
import { Box, Grid, Typography, Breadcrumbs } from "@mui/material";
import {
  GridToolbarQuickFilter,
  GridActionsCellItem,
  GridColumns,
  GridRowsProp,
} from "@mui/x-data-grid";
import { Add } from "@mui/icons-material";
import { useWorkspace, VaultAccount } from "../../../context/Workspace";
import { Layout } from "../../../components/Layout";
import { VaultAccountIcon, WithdrawIcon } from "../../../components/Icons";
import { DataGrid } from "../../../components/DataGrid";
import { ExportModal } from "../../../components/Modals/ExportModal";
import { RecoverAccountModal } from "../../../components/Modals/RecoverAccountModal";
import { WithdrawModal } from "../../../components/Modals/WithdrawModal";

type Row = {
  accountId: number;
  name: string;
  balance?: number;
  addresses: string[];
};

type GridToolbarProps = {
  onClickExport: VoidFunction;
  onClickAddAccount: VoidFunction;
};

const GridToolbar = ({
  onClickExport,
  onClickAddAccount,
}: GridToolbarProps) => (
  <>
    <GridToolbarQuickFilter
      placeholder="Account Name or Address"
      variant="outlined"
      sx={{
        minWidth: "250px",
        backgroundColor: "rgba(84, 83, 96, 0.1)",
        padding: "0 8px",
        borderRadius: "24px",
        "& .MuiInputBase-root": {
          padding: 0,
        },
        "& .MuiInputBase-input": {
          padding: 0,
        },
        "& fieldset": {
          display: "none",
        },
      }}
    />
    <Box>
      <Button
        variant="text"
        size="small"
        sx={{ marginRight: "1rem" }}
        onClick={onClickExport}
      >
        Export
      </Button>
      {/* <Button variant="text" size="small" sx={{ marginRight: "1rem" }}>
        Get Balances
      </Button> */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<Add />}
        onClick={onClickAddAccount}
      >
        Vault Account
      </Button>
    </Box>
  </>
);

const Vault: NextPageWithLayout = () => {
  const router = useRouter();

  const { vaultAccounts } = useWorkspace();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleOpenExportModal = () => setIsExportModalOpen(true);
  const handleCloseExportModal = () => setIsExportModalOpen(false);

  const [isRecoverAccountModalOpen, setIsRecoverAccountModalOpen] =
    useState(false);

  const handleOpenRecoverAccountModal = () =>
    setIsRecoverAccountModalOpen(true);
  const handleCloseRecoverAccountModal = () =>
    setIsRecoverAccountModalOpen(false);

  const [withdrawalAccountId, setWithdrawalAccountId] = useState<
    number | undefined
  >(undefined);

  const handleOpenWithdrawModal = (_accountId: number) =>
    setWithdrawalAccountId(_accountId);
  const handleCloseWithdrawModal = () => setWithdrawalAccountId(undefined);

  const columns = useMemo<GridColumns<Row>>(
    () => [
      {
        field: "icon",
        headerName: "Icon",
        width: 60,
        sortable: false,
        filterable: false,
        getApplyQuickFilterFn: undefined,
        renderCell: (params) => (
          <Box
            width={40}
            height={40}
            display="flex"
            alignItems="center"
            justifyContent="center"
            border={(theme) => `solid 1px ${theme.palette.grey[200]}`}
          >
            <VaultAccountIcon />
          </Box>
        ),
      },
      {
        field: "accountId",
        headerName: "ID",
        sortable: true,
        filterable: false,
        getApplyQuickFilterFn: undefined,
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        editable: true,
        sortable: true,
        filterable: true,
        getApplyQuickFilterFn: (search: string) => (params) =>
          params.row.name.toLowerCase().includes(search.toLowerCase()),
      },
      {
        field: "balance",
        headerName: "Balance",
        type: "number",
        width: 150,
        sortable: true,
        filterable: false,
        getApplyQuickFilterFn: undefined,
      },
      {
        field: "addresses",
        headerName: "Addresses",
        sortable: false,
        filterable: false,
        getApplyQuickFilterFn: (search: string) => (params) =>
          params.row.addresses.some(
            (address) => address.toLowerCase() === search.toLowerCase()
          ),
      },
      {
        field: "actions",
        type: "actions",
        width: 50,
        getActions: (params) => [
          <GridActionsCellItem
            key={`withdraw-${params.id}`}
            icon={<WithdrawIcon />}
            label="Withdraw"
            onClick={() => handleOpenWithdrawModal(params.row.accountId)}
          />,
        ],
      },
    ],
    []
  );

  const rows = useMemo<GridRowsProp<Row>>(
    () =>
      Array.from(vaultAccounts).map(([accountId, account]) => ({
        accountId,
        name: account.name,
        balance: undefined,
        addresses: Array.from(account.wallets)
          .flatMap(([_, wallet]) => wallet.derivations)
          .map((derivation) => derivation.address),
      })),
    [vaultAccounts]
  );

  return (
    <>
      {vaultAccounts.size ? (
        <DataGrid<Row>
          heading={
            <>
              <Typography variant="h1" marginY={0}>
                Accounts
              </Typography>
              <Breadcrumbs
                sx={{
                  minHeight: "48px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography variant="h2">My Vault</Typography>
              </Breadcrumbs>
            </>
          }
          getRowId={(row) => row.accountId}
          rows={rows}
          columns={columns}
          componentsProps={{
            toolbar: {
              children: (
                <GridToolbar
                  onClickExport={handleOpenExportModal}
                  onClickAddAccount={handleOpenRecoverAccountModal}
                />
              ),
            },
          }}
          columnVisibilityModel={{ accountId: false, addresses: false }}
          initialState={{
            sorting: {
              sortModel: [
                { field: "name", sort: "asc" },
                { field: "id", sort: "asc" },
              ],
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
        <Grid
          container
          spacing={2}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Grid item>
            <VaultAccountIcon sx={{ fontSize: "5em" }} />
          </Grid>
          <Grid item>
            <Typography variant="h1">Recover Vault Accounts</Typography>
          </Grid>
          <Grid item>
            <Typography paragraph variant="body1">
              Make withdrawals or import your keys into other wallets.
            </Typography>
          </Grid>
          <Grid item>
            <Button startIcon={<Add />} onClick={handleOpenRecoverAccountModal}>
              Vault Account
            </Button>
          </Grid>
        </Grid>
      )}
      <ExportModal open={isExportModalOpen} onClose={handleCloseExportModal} />
      <RecoverAccountModal
        open={isRecoverAccountModalOpen}
        onClose={handleCloseRecoverAccountModal}
      />
      <WithdrawModal
        accountId={withdrawalAccountId}
        open={typeof withdrawalAccountId === "number"}
        onClose={handleCloseWithdrawModal}
      />
    </>
  );
};

Vault.getLayout = (page) => <Layout>{page}</Layout>;

export default Vault;
