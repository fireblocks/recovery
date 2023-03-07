import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import {
  AssetId,
  AssetIcon,
  Button,
  Link,
  getAssetInfo,
  assets,
} from "@fireblocks/recovery-shared";
import { Box, Typography, Breadcrumbs } from "@mui/material";
import {
  GridToolbarQuickFilter,
  GridActionsCellItem,
  GridColumns,
  GridRowsProp,
} from "@mui/x-data-grid";
import { Add, NavigateNext } from "@mui/icons-material";
import type { NextPageWithLayout } from "../../../_app";
import { useWorkspace, Derivation } from "../../../../context/Workspace";
import { Layout } from "../../../../components/Layout";
import {
  DepositAddressesIcon,
  KeyIcon,
  VaultAccountIcon,
  WithdrawIcon,
} from "../../../../components/Icons";
import { DataGrid } from "../../../../components/DataGrid";
import { RecoverWalletModal } from "../../../../components/Modals/RecoverWalletModal";
import { AddressesModal } from "../../../../components/Modals/AddressesModal";
import { KeysModal } from "../../../../components/Modals/KeysModal";
import { WithdrawModal } from "../../../../components/Modals/WithdrawModal";

export type Row = {
  assetId: AssetId;
  balance?: number;
  derivations: Derivation[];
};

type GridToolbarProps = {
  isAddWalletDisabled: boolean;
  onClickAddWallet: VoidFunction;
};

function GridToolbar({
  isAddWalletDisabled,
  onClickAddWallet,
}: GridToolbarProps) {
  return (
    <>
      <GridToolbarQuickFilter
        placeholder="Asset or Address"
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
        {/* <Button variant="text" size="small" sx={{ marginRight: "1rem" }}>
        Get Balance
      </Button> */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          disabled={isAddWalletDisabled}
          onClick={onClickAddWallet}
        >
          Asset Wallet
        </Button>
      </Box>
    </>
  );
}

const VaultAccount: NextPageWithLayout = () => {
  const router = useRouter();

  const { vaultAccounts } = useWorkspace();

  const accountId =
    typeof router.query.accountId === "string"
      ? parseInt(router.query.accountId, 10)
      : undefined;

  const vaultAccount =
    typeof accountId === "number" ? vaultAccounts.get(accountId) : undefined;

  const newAssets = assets.filter(
    (asset) => !vaultAccount?.wallets.get(asset.id)
  );

  const [isRestoreWalletModalOpen, setIsRestoreWalletModalOpen] =
    useState(false);

  const handleOpenRestoreWalletModal = () => setIsRestoreWalletModalOpen(true);
  const handleCloseRestoreWalletModal = () =>
    setIsRestoreWalletModalOpen(false);

  const [addressesModalRow, setAddressesModalRow] = useState<Row | null>(null);

  const handleOpenAddressesModal = (row: Row) => setAddressesModalRow(row);
  const handleCloseAddressesModal = () => setAddressesModalRow(null);

  const [keysModalRow, setKeysModalRow] = useState<Row | null>(null);

  const handleOpenKeysModal = (row: Row) => setKeysModalRow(row);
  const handleCloseKeysModal = () => setKeysModalRow(null);

  const [withdrawalAssetId, setWithdrawalAssetId] = useState<
    AssetId | undefined
  >(undefined);

  const handleOpenWithdrawModal = (assetId: AssetId) =>
    setWithdrawalAssetId(assetId);
  const handleCloseWithdrawModal = () => setWithdrawalAssetId(undefined);

  const columns = useMemo<GridColumns<Row>>(
    () => [
      {
        field: "icon",
        headerName: "Icon",
        width: 60,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box
            width={40}
            height={40}
            display="flex"
            alignItems="center"
            justifyContent="center"
            border={(theme) => `solid 1px ${theme.palette.grey[200]}`}
            borderRadius={40}
          >
            <AssetIcon assetId={params.row.assetId as AssetId} />
          </Box>
        ),
      },
      {
        field: "assetId",
        headerName: "Asset",
        flex: 1,
        sortable: true,
        filterable: true,
        getApplyQuickFilterFn: (search: string) => {
          const lowercaseSearch = search.toLowerCase();

          return (params) => {
            const { assetId } = params.row;

            return (
              assetId.toLowerCase().includes(lowercaseSearch) ||
              getAssetInfo(assetId).name.toLowerCase().includes(lowercaseSearch)
            );
          };
        },
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
        field: "derivations",
        headerName: "Derivations",
        sortable: false,
        filterable: false,
        getApplyQuickFilterFn: (search: string) => {
          const lowercaseSearch = search.toLowerCase();

          return (params) =>
            params.row.derivations.some(
              (derivation) =>
                derivation.address.toLowerCase() === lowercaseSearch
            );
        },
      },
      {
        field: "actions",
        type: "actions",
        width: 126,
        getActions: (params) => [
          <GridActionsCellItem
            key={`addresses-${params.id}`}
            icon={<DepositAddressesIcon />}
            label="Addresses"
            onClick={() => handleOpenAddressesModal(params.row)}
            disabled={!params.row.derivations?.length}
          />,
          // TODO: Disable for non-derived wallets
          <GridActionsCellItem
            key={`keys-${params.id}`}
            icon={<KeyIcon />}
            label="Keys"
            onClick={() => handleOpenKeysModal(params.row)}
            disabled={
              !params.row.derivations?.some(
                (derivation) => derivation.privateKey
              )
            }
          />,
          <GridActionsCellItem
            key={`withdraw-${params.id}`}
            icon={<WithdrawIcon />}
            label="Withdraw"
            onClick={() => handleOpenWithdrawModal(params.row.assetId)}
            disabled={!params.row.derivations?.length}
          />,
        ],
      },
    ],
    []
  );

  const rows: GridRowsProp<Row> = vaultAccount
    ? Array.from(vaultAccount.wallets)
        .map(([assetId, wallet]) => ({
          assetId,
          balance: wallet.balance,
          derivations: wallet.derivations,
        }))
        // TODO: Make this a user setting
        .filter((row) =>
          row.derivations.some((derivation) => derivation.privateKey)
        )
    : [];

  return (
    <>
      <DataGrid<Row>
        heading={
          <>
            <Typography variant="h1" marginY={0}>
              Accounts
            </Typography>
            <Breadcrumbs
              separator={<NavigateNext />}
              sx={{ minHeight: "48px", display: "flex", alignItems: "center" }}
            >
              <Link href="/accounts/vault" underline="none">
                <Typography variant="h2" fontWeight="normal">
                  My Vault
                </Typography>
              </Link>
              <Typography variant="h2" display="flex" alignItems="center">
                <Box
                  marginRight="0.5em"
                  width={32}
                  height={32}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border={(theme) => `solid 1px ${theme.palette.grey[200]}`}
                  sx={{ background: "#FFF" }}
                >
                  <VaultAccountIcon sx={{ fontSize: "19px" }} />
                </Box>
                {vaultAccount?.name}
              </Typography>
            </Breadcrumbs>
          </>
        }
        getRowId={(row) => row.assetId}
        rows={rows}
        columns={columns}
        headerHeight={0}
        disableSelectionOnClick
        componentsProps={{
          toolbar: {
            children: (
              <GridToolbar
                isAddWalletDisabled={!newAssets.length}
                onClickAddWallet={handleOpenRestoreWalletModal}
              />
            ),
          },
        }}
        columnVisibilityModel={{ derivations: false }}
        initialState={{
          sorting: {
            sortModel: [{ field: "assetId", sort: "asc" }],
          },
        }}
      />
      <RecoverWalletModal
        assets={newAssets}
        accountId={accountId}
        open={isRestoreWalletModalOpen}
        onClose={handleCloseRestoreWalletModal}
      />
      <AddressesModal
        open={!!addressesModalRow}
        row={addressesModalRow}
        onClose={handleCloseAddressesModal}
      />
      <KeysModal
        open={!!keysModalRow}
        row={keysModalRow}
        onClose={handleCloseKeysModal}
      />
      <WithdrawModal
        assetId={withdrawalAssetId}
        accountId={accountId}
        open={typeof withdrawalAssetId === "string"}
        onClose={handleCloseWithdrawModal}
      />
    </>
  );
};

VaultAccount.getLayout = (page) => <Layout>{page}</Layout>;

export default VaultAccount;
