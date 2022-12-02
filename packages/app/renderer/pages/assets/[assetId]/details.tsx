import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Grid, Typography, Button } from "@mui/material";
import { TextField } from "../../../components/TextField";
import { getAssetName, getAssetIcon } from "../../../lib/assetInfo";
import { formatPath } from "../../../lib/bip44";

const WalletDetails = () => {
  const router = useRouter();

  const assetId = (router.query.assetId ?? "") as string;
  const path = (router.query.path ?? "") as string;
  const address = (router.query.address ?? "") as string;
  const publicKey = (router.query.publicKey ?? "") as string;
  const privateKey = (router.query.privateKey ?? "") as string;

  const assetName = getAssetName(assetId);
  const [_, coinType, accountId, change, index] = path.split(",");

  const title = `${assetName} Wallet`;

  const onOpenWithdrawal = () => {
    const withdrawalParams = new URLSearchParams({
      path,
      testnet: "false",
    });

    window.open(
      `/assets/${assetId}/withdraw?${withdrawalParams.toString()}`,
      "_blank"
    );
  };

  return (
    <Box padding="1rem">
      <Head>
        <title>{title}</title>
      </Head>
      <Grid container spacing={2} alignItems="center" marginBottom="1rem">
        <Grid item flex={1}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>{getAssetIcon(assetId)}</Grid>
            <Grid item>
              <Typography variant="h1" margin={0}>
                {title}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={onOpenWithdrawal}
          >
            Withdraw
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            id="path"
            label="BIP32 Path"
            value={formatPath(path)}
            enableCopy
          />
        </Grid>
        <Grid item xs={6} display="flex">
          <Grid container spacing={1} alignSelf="flex-end">
            <Grid item xs={6}>
              <Typography variant="body1">Coin Type: {coinType}</Typography>
              <Typography variant="body1">Account: {accountId}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">Change: {change}</Typography>
              <Typography variant="body1">Index: {index}</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="address"
            label="Address"
            value={address}
            enableQr
            enableCopy
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="pub"
            label="Public Key"
            value={publicKey}
            enableQr
            enableCopy
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="prv"
            type="password"
            label="Private Key"
            value={privateKey}
            enableQr
            enableCopy
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WalletDetails;
