import type { NextPageWithLayout } from "../../_app";
import { useState } from "react";
import { Layout } from "../../../components/Layout";
import { TextField } from "../../../components/TextField";
import { Button } from "../../../components/Button";
import { NextLinkComposed } from "../../../components/Link";
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
} from "@mui/material";
import { Key, ArrowUpward } from "@mui/icons-material";
import { deserializePath, serializePath } from "../../../lib/bip44";
import { useWorkspace, Wallet } from "../../../context/Workspace";
import { csvExport } from "../../../lib/csvExport";
import { getAssetInfo } from "../../../lib/assetInfo";
import { download } from "../../../lib/download";

const Asset: NextPageWithLayout = () => {
  const { asset, wallets, currentAssetWallets } = useWorkspace();

  const [showPaths, setShowPaths] = useState(false);

  const toggleShowPaths = () => setShowPaths((prev) => !prev);

  const onOpenKeys = (wallet: Wallet) => {
    const keysParams = new URLSearchParams({
      path: wallet.pathParts.join(","),
      address: wallet.address,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
    });

    window.open(
      `/assets/${asset?.id}/details?${keysParams.toString()}`,
      "_blank"
    );
  };

  const onOpenWithdrawal = (wallet: Wallet) => {
    const withdrawalParams = new URLSearchParams({
      path: wallet.pathParts.join(","),
      testnet: "false",
    });

    window.open(
      `/assets/${asset?.id}/withdraw?${withdrawalParams.toString()}`,
      "_blank"
    );
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
            <Grid item>
              <Button variant="text" onClick={toggleShowPaths}>
                {showPaths ? "Hide" : "Show"} Paths
              </Button>
            </Grid>
            <Grid item>
              <Button variant="text" onClick={onExportCsv}>
                Export
              </Button>
            </Grid>
            <Grid item>
              <Button
                color="primary"
                component={NextLinkComposed}
                to={{
                  pathname: "/assets/[assetId]/add",
                  query: { assetId: asset?.id as string },
                }}
                target="_blank"
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table aria-label={`${asset?.name} wallets`} size="small">
          <TableHead>
            <TableRow>
              {showPaths ? (
                <TableCell>Path</TableCell>
              ) : (
                <>
                  <TableCell>Account</TableCell>
                  {asset?.derivation.utxo && <TableCell>Index</TableCell>}
                </>
              )}
              <TableCell>Address</TableCell>
              <TableCell align="center">Keys</TableCell>
              <TableCell align="center">Withdraw</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentAssetWallets.map((wallet) => {
              const serializedPath = serializePath(wallet.pathParts);
              const { accountId, index } = deserializePath(wallet.pathParts);

              return (
                <TableRow
                  key={wallet.address}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  {showPaths ? (
                    <TableCell component="th" scope="row">
                      {serializedPath}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell component="th" scope="row">
                        {accountId}
                      </TableCell>
                      {asset?.derivation.utxo && <TableCell>{index}</TableCell>}
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
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      aria-label="Show keys"
                      onClick={() => onOpenKeys(wallet)}
                    >
                      <Key />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      aria-label="Withdraw"
                      onClick={() => onOpenWithdrawal(wallet)}
                    >
                      <ArrowUpward />
                    </IconButton>
                  </TableCell>
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
