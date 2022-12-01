import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../../_app";
import { useState, useCallback, ReactElement } from "react";
import { Layout } from "../../../components/Layout";
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
import {
  Add,
  FileDownload,
  AlternateEmail,
  Key,
  ArrowUpward,
} from "@mui/icons-material";
import { getAssetName } from "../../../lib/assetInfo";

type Wallet = {
  accountId: number;
  addresses: string[];
};

type DeriveKeysResponse = {
  prv: string;
  pub: string;
  address: string;
  path: string;
};

const Asset: NextPageWithLayout = () => {
  const router = useRouter();

  const [wallets, setWallets] = useState<Wallet[]>([]);

  const assetId = router.query.assetId as string;

  const addWallet = useCallback(async () => {
    // TODO: User input
    const accountId = wallets.length;

    try {
      const searchParams = new URLSearchParams({
        asset: assetId.split("_TEST")[0],
        account: accountId.toString(),
        change: "0",
        index_start: "0",
        index_end: "0",
        xpub: "false",
        legacy: "false",
        checksum: "false",
        testnet: assetId.includes("_TEST") ? "true" : "false",
      });

      // TODO: USE DYNAMIC PORT
      const res = await fetch(
        `http://localhost:8000/derive-keys?${searchParams}`
      );

      const data = (await res.json()) as DeriveKeysResponse;

      console.info("Derive keys response:", data);

      const wallet = {
        accountId: accountId,
        addresses: [data.address],
      };

      setWallets((prev) => [...prev, wallet]);
    } catch (err) {
      const error = err as Error;
      console.error("Derive keys error:", error.message);
    }
  }, [assetId, wallets.length]);

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid item>
          <Typography variant="h1">{getAssetName(assetId)}</Typography>
        </Grid>
        <Grid item>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button size="small" startIcon={<FileDownload />}>
                Export CSV
              </Button>
            </Grid>
            <Grid item>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={addWallet}
              >
                Add Wallet
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Account</TableCell>
              <TableCell align="center">Address</TableCell>
              <TableCell align="center">Keys</TableCell>
              <TableCell align="center">Withdraw</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow
                key={wallet.accountId}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {wallet.accountId}
                </TableCell>
                <TableCell align="center">
                  <IconButton aria-label="Show address">
                    <AlternateEmail />
                  </IconButton>
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
