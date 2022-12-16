import type { GetStaticProps, GetStaticPaths } from "next";
import type { NextPageWithLayout } from "../../_app";
import { useState, ChangeEvent } from "react";
import {
  NextLinkComposed,
  TextField,
  Button,
  getAssetInfo,
  assetIds,
  AssetId,
  AssetType,
  AssetIcon,
} from "shared";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
} from "@mui/material";
import { Key, ArrowUpward } from "@mui/icons-material";
import { pythonServerUrlParams } from "../../../lib/pythonClient";
import { deserializePath, serializePath } from "../../../lib/bip44";
import { useWorkspace, Wallet } from "../../../context/Workspace";
import { csvExport } from "../../../lib/csvExport";
import { download } from "../../../lib/download";
import { Layout } from "../../../components/Layout";
import { AddWallets } from "../../../components/AddWallets";

const Asset: NextPageWithLayout = () => {
  const { asset, wallets, currentAssetWallets, handleDeleteWallets } =
    useWorkspace();

  const [showPaths, setShowPaths] = useState(false);

  const toggleShowPaths = () => setShowPaths((prev) => !prev);

  const [isEditing, setIsEditing] = useState(false);

  const [addressDeletionQueueMap, setAddressDeletionQueueMap] = useState<
    Record<string, boolean>
  >({});

  const onToggleSelectWallet = (
    event: ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    const address = event.target.value;

    setAddressDeletionQueueMap((prev) => ({ ...prev, [address]: checked }));
  };

  const onToggleEditing = () => setIsEditing((prev) => !prev);

  const onDeleteWallets = () => {
    const addressesToDelete = Object.keys(addressDeletionQueueMap).filter(
      (address) => addressDeletionQueueMap[address]
    );

    handleDeleteWallets(addressesToDelete);

    setAddressDeletionQueueMap({});
  };

  const onExportCsv = async () => {
    const data = wallets.map((wallet) => {
      const { accountId } = deserializePath(wallet.pathParts);

      return {
        // accountName: "",
        accountId,
        assetId: wallet.assetId,
        assetName: getAssetInfo(wallet.assetId)?.name ?? wallet.assetId,
        address: wallet.address,
        addressType: wallet.addressType,
        // addressDescription: "",
        // tag: "",
        hdPath: ["m", ...wallet.pathParts].join(" / "),
      };
    });

    const csv = await csvExport(data);

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9T-]/g, "")
      .slice(0, -3);

    const filename = `Fireblocks_vault_addresses_recovery_${timestamp}.csv`;

    download(csv, filename, "text/plain");
  };

  if (!currentAssetWallets.length) {
    return (
      <Grid
        container
        spacing={2}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Grid item>
          <AssetIcon assetId={asset?.id as AssetId} sx={{ fontSize: "5em" }} />
        </Grid>
        <Grid item>
          <Typography variant="h1">Recover {asset?.name} Wallets</Typography>
        </Grid>
        <Grid item>
          <Typography paragraph variant="body1">
            Make withdrawals or import your keys into other wallets.
          </Typography>
        </Grid>
        <Grid item>
          {!!asset && (
            <AddWallets
              asset={asset}
              anchorOrigin={{
                vertical: "center",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "center",
                horizontal: "center",
              }}
            />
          )}
        </Grid>
      </Grid>
    );
  }

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid item>
          <Typography variant="h1">{asset?.name}</Typography>
        </Grid>
        <Grid item>
          <Grid container spacing={2} alignItems="center">
            {!isEditing && (
              <Grid item>
                <Button variant="text" onClick={toggleShowPaths}>
                  {showPaths ? "Hide" : "Show"} Paths
                </Button>
              </Grid>
            )}
            {!isEditing && (
              <Grid item>
                <Button variant="text" onClick={onExportCsv}>
                  Export
                </Button>
              </Grid>
            )}
            {isEditing && (
              <Grid item>
                <Button variant="text" color="error" onClick={onDeleteWallets}>
                  Delete
                </Button>
              </Grid>
            )}
            <Grid item>
              <Button
                variant={isEditing ? "contained" : "text"}
                onClick={onToggleEditing}
              >
                {isEditing ? "Done" : "Edit"}
              </Button>
            </Grid>
            {!!asset && !isEditing && (
              <Grid item>
                <AddWallets
                  asset={asset}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table aria-label={`${asset?.name} wallets`} size="small">
          <TableHead>
            <TableRow>
              {isEditing && <TableCell>Select</TableCell>}
              {showPaths ? (
                <TableCell>Path</TableCell>
              ) : (
                <>
                  <TableCell>Account</TableCell>
                  {asset?.type === AssetType.UTXO && (
                    <TableCell>Index</TableCell>
                  )}
                </>
              )}
              <TableCell>Address</TableCell>
              {!isEditing && (
                <>
                  <TableCell align="center">Keys</TableCell>
                  <TableCell align="center">Withdraw</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentAssetWallets.map((wallet, arrayIndex) => {
              const serializedPath = serializePath(wallet.pathParts);
              const path = deserializePath(wallet.pathParts);

              const nextWallet = currentAssetWallets[arrayIndex + 1] as
                | Wallet
                | undefined;
              const nextWalletPath = nextWallet
                ? deserializePath(nextWallet.pathParts)
                : ({} as ReturnType<typeof deserializePath<number>>);
              const nextWalletIsSamePath =
                path.accountId === nextWalletPath.accountId &&
                path.index === nextWalletPath.index;

              return (
                <TableRow
                  key={wallet.address}
                  sx={{
                    "td, th": { border: nextWalletIsSamePath ? 0 : undefined },
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  {isEditing && (
                    <TableCell>
                      <Checkbox
                        color="error"
                        value={wallet.address}
                        checked={
                          addressDeletionQueueMap[wallet.address] ?? false
                        }
                        inputProps={{ "aria-label": "Select to delete" }}
                        onChange={onToggleSelectWallet}
                      />
                    </TableCell>
                  )}
                  {showPaths ? (
                    <TableCell component="th" scope="row">
                      {serializedPath}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell component="th" scope="row">
                        {path.accountId}
                      </TableCell>
                      {asset?.type === AssetType.UTXO && (
                        <TableCell>{path.index}</TableCell>
                      )}
                    </>
                  )}
                  <TableCell align="center">
                    <TextField
                      id={`address-${wallet.address}`}
                      type="text"
                      label={`${asset?.name} Address`}
                      value={wallet.address}
                      hideLabel
                      enableQr
                      enableCopy
                      isMonospace
                    />
                  </TableCell>
                  {!isEditing && (
                    <>
                      <TableCell align="center">
                        <IconButton
                          aria-label="Show keys"
                          component={NextLinkComposed}
                          to={{
                            pathname: "/assets/[assetId]/details",
                            query: {
                              ...pythonServerUrlParams,
                              assetId: asset?.id as string,
                              path: wallet.pathParts.join(","),
                              address: wallet.address,
                              publicKey: wallet.publicKey,
                              privateKey: wallet.privateKey,
                              wif: wallet.wif,
                            },
                          }}
                          target="_blank"
                        >
                          <Key />
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          aria-label="Withdraw"
                          component={NextLinkComposed}
                          to={{
                            pathname: "/assets/[assetId]/withdraw",
                            query: {
                              ...pythonServerUrlParams,
                              assetId: asset?.id as string,
                              address: wallet.address,
                              privateKey: wallet.privateKey,
                            },
                          }}
                          target="_blank"
                        >
                          <ArrowUpward />
                        </IconButton>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

Asset.getLayout = (page) => <Layout>{page}</Layout>;

export default Asset;

export const getStaticProps: GetStaticProps = async ({ params }) => ({
  props: {},
});

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: assetIds.map((assetId) => ({ params: { assetId } })),
  fallback: false,
});
