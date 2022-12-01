import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../../_app";
import { useMutation } from "@tanstack/react-query";
import { useState, ReactElement } from "react";
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

type Wallet = {
  path: string;
  accountId: number;
  index: number;
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
  indexStart: number;
  indexEnd: number;
};

const addWallet = async ({
  assetId,
  accountId,
  indexStart,
  indexEnd,
}: AddWalletVariables) => {
  const searchParams = new URLSearchParams({
    asset: assetId.split("_TEST")[0],
    account: String(accountId),
    change: "0",
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

    const bip44Path = `m/${pathParts[0]}'/${pathParts[1]}'/${pathParts[2]}'/${pathParts[3]}/${pathParts[4]}`;

    return {
      path: bip44Path,
      accountId: Number(accountId),
      index: Number(pathParts[4]),
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
      indexStart: 0,
      indexEnd: 0,
    });

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
              <Button size="small" onClick={toggleShowPaths}>
                {showPaths ? "Hide" : "Show"} Paths
              </Button>
            </Grid>
            <Grid item>
              <Button size="small">Export</Button>
            </Grid>
            <Grid item>
              <Button
                size="small"
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
                    {wallet.path}
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
                  <IconButton aria-label="Show keys">
                    <Key />
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <IconButton aria-label="Withdraw">
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

Asset.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Asset;
