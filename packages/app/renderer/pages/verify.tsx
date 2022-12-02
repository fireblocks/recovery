import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { TextField } from "../components/TextField";
import { Box, Grid, Typography } from "@mui/material";

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
      <Typography variant="h1">Verify Keys</Typography>
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
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="fpub"
            label="FPUB"
            value={data.fpub}
            disabled={isLoading}
            enableCopy
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h2">Private Keys</Typography>
          <TextField
            id="xprv"
            type="password"
            label="XPRV"
            value={data.xprv}
            disabled={isLoading}
            enableCopy
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
          />
        </Grid>
      </Grid>
    </Box>
  );
};

Verify.getLayout = (page: ReactElement) => <Layout hideSidebar>{page}</Layout>;

export default Verify;
