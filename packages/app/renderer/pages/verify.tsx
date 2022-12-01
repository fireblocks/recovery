import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { Layout } from "../components/Layout";
import { TextField } from "../components/TextField";
import { Box, Grid, Typography } from "@mui/material";

// TODO: Read stored values
const XPUB =
  "xpub661MyMwAqRbcGfa1fQr7JtdBaCgefFD1pdzt1xf56vqX1hWmgeMhvxqjTBkLySerERmLByXPTZoMMeDkWS2msCUg5zn4vYZHZ4ecjX5256L";
const FPUB =
  "fpub8sZZXw2wbqVpVcGLGwc5ofj1fjtVQZpbTopKCP5hWkgy4gbWUK4UzaxmRQszuUwaxZWQ4j7FEwduyrhqMgZ5LVwUYmnbb6t6m3RkieV2WSV";
const XPRV =
  "xprv9s21ZrQH143K4ZtuNcBPjXZJJLCyA6xJ6ta3spD9e6LpuoqYxXyAetiHxdJ5DUoRHmek7iEZNaTTMR6MzGkH9znKrZa2Yo7paNWJ6HT3Dbp";
const FPRV =
  "fprv4LsXPWzhTTp9cXduCWonC2wkNsjN9Z6pXyiJa716Byvs16zffMAc5pXwc67LvHVNK87L935jCCKUF7Yi7omAnZ1pQnLc4UqbdSE3EdPpSHy";

const Verify: NextPageWithLayout = () => {
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
          <TextField id="passphrase" label="XPUB" value={XPUB} enableCopy />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="rsaKeyPassphrase"
            label="FPUB"
            value={FPUB}
            enableCopy
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h2">Private Keys</Typography>
          <TextField
            id="passphrase"
            type="password"
            label="XPRV"
            value={XPRV}
            enableCopy
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="rsaKeyPassphrase"
            type="password"
            label="FPRV"
            value={FPRV}
            enableCopy
          />
        </Grid>
      </Grid>
    </Box>
  );
};

Verify.getLayout = (page: ReactElement) => <Layout hideSidebar>{page}</Layout>;

export default Verify;
