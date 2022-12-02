import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../../_app";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "../../../components/Layout";
import { TextField } from "../../../components/TextField";
import {
  Box,
  Grid,
  Typography,
  Button,
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
import { getAssetName } from "../../../lib/assetInfo";
import { formatPath } from "../../../lib/bip44";

type Wallet = {
  path: string;
  accountId: string;
  change: string;
  index: string;
  address: string;
  publicKey: string;
  privateKey: string;
};

type DeriveKeysResponse = {
  prv: string;
  pub: string;
  address: string;
  path: string;
};

type AddWalletVariables = {
  assetId: string;
  accountId: number;
  change: number;
  indexStart: number;
  indexEnd: number;
};

const addWallet = async ({
  assetId,
  accountId,
  change,
  indexStart,
  indexEnd,
}: AddWalletVariables) => {
  const searchParams = new URLSearchParams({
    asset: assetId.split("_TEST")[0],
    account: String(accountId),
    change: String(change),
    index_start: String(indexStart),
    index_end: String(indexEnd),
    xpub: "false",
    legacy: "false",
    checksum: "false",
    testnet: assetId.includes("_TEST") ? "true" : "false",
  });

  // TODO: USE DYNAMIC PORT
  const res = await fetch(`http://localhost:8000/derive-keys?${searchParams}`);

  const derivations = (await res.json()) as DeriveKeysResponse[];

  const newWallets = derivations.map<Wallet>((data) => {
    const pathParts = data.path.split(",");

    return {
      path: data.path,
      accountId: pathParts[2],
      change: pathParts[3],
      index: pathParts[4],
      address: data.address,
      publicKey: data.pub,
      privateKey: data.prv,
    };
  });

  return newWallets;
};

const Asset: NextPageWithLayout = () => {
  const router = useRouter();

  const [wallets, setWallets] = useState<Wallet[]>([]);

  const [showPaths, setShowPaths] = useState(false);

  const assetId = router.query.assetId as string;

  const assetName = getAssetName(assetId);

  const toggleShowPaths = () => setShowPaths((prev) => !prev);

  const addWalletMutation = useMutation({
    mutationFn: addWallet,
    onSuccess: (newWallets) => setWallets((prev) => [...prev, ...newWallets]),
    onError: (err) => {
      throw err;
    },
  });

  const onAddWallet = () =>
    addWalletMutation.mutate({
      assetId,
      accountId: wallets.length,
      change: 0,
      indexStart: 0,
      indexEnd: 0,
    });

  const onOpenKeys = (wallet: Wallet) => {
    const keysParams = new URLSearchParams({
      path: wallet.path,
      address: wallet.address,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
    });

    window.open(
      `/assets/${assetId}/details?${keysParams.toString()}`,
      "_blank"
    );
  };

  const onOpenWithdrawal = (wallet: Wallet) => {
    const withdrawalParams = new URLSearchParams({
      path: wallet.path,
      testnet: "false",
    });

    window.open(
      `/assets/${assetId}/withdraw?${withdrawalParams.toString()}`,
      "_blank"
    );
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
          <Typography variant="h1">{assetName}</Typography>
        </Grid>
        <Grid item>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button onClick={toggleShowPaths}>
                {showPaths ? "Hide" : "Show"} Paths
              </Button>
            </Grid>
            {/* <Grid item>
              <Button>Export</Button>
            </Grid> */}
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={onAddWallet}
                disabled={addWalletMutation.isLoading}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table aria-label={`${assetName} wallets`} size="small">
          <TableHead>
            <TableRow>
              {showPaths ? (
                <TableCell>Path</TableCell>
              ) : (
                <>
                  <TableCell>Account</TableCell>
                  <TableCell>Index</TableCell>
                </>
              )}
              <TableCell>Address</TableCell>
              <TableCell align="center">Keys</TableCell>
              <TableCell align="center">Withdraw</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow
                key={`${assetId}-${wallet.path}`}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                {showPaths ? (
                  <TableCell component="th" scope="row">
                    {formatPath(wallet.path)}
                  </TableCell>
                ) : (
                  <>
                    <TableCell component="th" scope="row">
                      {wallet.accountId}
                    </TableCell>
                    <TableCell>{wallet.index}</TableCell>
                  </>
                )}
                <TableCell align="center">
                  <TextField
                    id={`address-${wallet.address}`}
                    type="text"
                    label={`${assetName} Address`}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

Asset.getLayout = (page) => <Layout>{page}</Layout>;

export default Asset;
