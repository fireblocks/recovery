import { useRouter, NextRouter } from "next/router";
import type { NextPageWithLayout } from "./_app";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { TextField } from "../components/TextField";
import { Box, Grid, Typography, InputAdornment } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

type ExtendedKeysResponse = {
  xprv: string;
  fprv: string;
  xpub: string;
  fpub: string;
};

const getExtendedKeys = async () => {
  // TODO: USE DYNAMIC PORT
  const res = await fetch(`http://localhost:8000/show-extended-keys`);

  const keys = (await res.json()) as ExtendedKeysResponse;

  return keys;
};

const Verify: NextPageWithLayout = () => {
  const router = useRouter();

  const verifyOnly = router.query.verifyOnly === "true";

  const { data, isLoading } = useQuery({
    queryKey: ["extended-keys"],
    queryFn: getExtendedKeys,
    initialData: {
      xprv: "",
      fprv: "",
      xpub: "",
      fpub: "",
    },
  });

  return (
    <Box>
      <Typography variant="h1">Extended Keys</Typography>
      <Typography variant="body1" paragraph>
        The public keys and private keys of all of wallets in this workspace are
        derived from the extended public keys and private keys.
      </Typography>
      <Typography variant="body1" paragraph>
        Check that the recovered Fireblocks master public keys match the keys in
        your Fireblocks Console Settings.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h2">Public Keys</Typography>
          <TextField
            id="xpub"
            label="XPUB"
            value={data.xpub}
            disabled={isLoading}
            enableCopy
            isMonospace
            endAdornment={
              <InputAdornment position="end">
                <CheckCircle color="success" sx={{ marginRight: "0.25rem" }} />
                Verified
              </InputAdornment>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="fpub"
            label="FPUB"
            value={data.fpub}
            disabled={isLoading}
            enableCopy
            isMonospace
            endAdornment={
              <InputAdornment position="end">
                <CheckCircle color="success" sx={{ marginRight: "0.25rem" }} />
                Verified
              </InputAdornment>
            }
          />
        </Grid>
        {!verifyOnly && (
          <>
            <Grid item xs={12}>
              <Typography variant="h2">Private Keys</Typography>
              <TextField
                id="xprv"
                type="password"
                label="XPRV"
                value={data.xprv}
                disabled={isLoading}
                enableCopy
                isMonospace
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="fprv"
                type="password"
                label="FPRV"
                value={data.fprv}
                disabled={isLoading}
                enableCopy
                isMonospace
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

Verify.getLayout = (page, router) => (
  <Layout hideNavigation={router.query.verifyOnly === "true"} hideSidebar>
    {page}
  </Layout>
);

export default Verify;
