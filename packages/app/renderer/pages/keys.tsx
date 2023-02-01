import { useRouter } from "next/router";
import type { NextPageWithLayout } from "./_app";
import { useQuery } from "@tanstack/react-query";
import { getExtendedKeys } from "../lib/pythonClient";
import { Layout } from "../components/Layout";
import { monospaceFontFamily, TextField } from "shared";
import { Box, Grid, Typography, InputAdornment } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const Verify: NextPageWithLayout = () => {
  const router = useRouter();

  const verifyOnly = router.query.verifyOnly === "true";

  const { data, isLoading } = useQuery({
    queryKey: ["extendedKeys"],
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
      <Typography variant="h1">
        Extended {verifyOnly ? "Public " : ""}Keys
      </Typography>
      <Typography variant="body1" paragraph>
        Check that the recovered Fireblocks extended public keys match the keys
        in your Fireblocks Console Settings.
      </Typography>
      <Typography variant="body1" paragraph>
        The public keys and private keys of all of wallets in this workspace are
        derived from the extended public keys and private keys.
      </Typography>
      <Typography variant="body1" paragraph>
        ECDSA extended keys (
        <Typography component="span" fontFamily={monospaceFontFamily}>
          xpub/xprv
        </Typography>
        ) can be used with wallet software that imports BIP32 extended private
        keys. Fireblocks Ed25519 extended keys (
        <Typography component="span" fontFamily={monospaceFontFamily}>
          fpub/fprv
        </Typography>
        ) are Fireblocks-specific and can only be used by Recovery Utility.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h2">Public Keys</Typography>
          <TextField
            id="xpub"
            label="XPUB (ECDSA)"
            value={data.xpub}
            disabled={isLoading}
            enableCopy
            isMonospace
            endAdornment={
              <InputAdornment position="end">
                <CheckCircle color="success" sx={{ marginRight: "0.25rem" }} />
                Valid
              </InputAdornment>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="fpub"
            label="FPUB (Fireblocks Ed25519)"
            value={data.fpub}
            disabled={isLoading}
            enableCopy
            isMonospace
            endAdornment={
              <InputAdornment position="end">
                <CheckCircle color="success" sx={{ marginRight: "0.25rem" }} />
                Valid
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
                label="XPRV (ECDSA)"
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
                label="FPRV (Fireblocks Ed25519)"
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

Verify.getLayout = (page, router) => {
  const verifyOnly = router.query.verifyOnly === "true";

  return (
    <Layout showBack={verifyOnly} hideNavigation={verifyOnly}>
      {page}
    </Layout>
  );
};

export default Verify;
