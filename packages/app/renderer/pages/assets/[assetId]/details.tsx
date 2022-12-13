import Head from "next/head";
import { Box, Grid, Typography } from "@mui/material";
import {
  AssetIcon,
  NextLinkComposed,
  TextField,
  Button,
  AssetId,
} from "shared";
import { deserializePath, serializePath } from "../../../lib/bip44";
import { useWorkspace } from "../../../context/Workspace";

const WalletDetails = () => {
  const { asset, pathParts, address, publicKey, privateKey } = useWorkspace();

  const { coinType, accountId, change, index } = deserializePath(pathParts);

  const title = `${asset?.name} Wallet`;

  return (
    <Box padding="1rem">
      <Head>
        <title>{title}</title>
      </Head>
      <Grid container spacing={2} alignItems="center" marginBottom="1rem">
        <Grid item flex={1}>
          <Typography
            variant="h1"
            display="flex"
            alignItems="center"
            margin="0"
          >
            <Box display="flex" alignItems="center" marginRight="0.5rem">
              <AssetIcon assetId={asset?.id as AssetId} />
            </Box>
            {title}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            color="primary"
            component={NextLinkComposed}
            to={{
              pathname: "/assets/[assetId]/withdraw",
              query: {
                assetId: asset?.id as string,
                address: address as string,
                privateKey: privateKey as string,
              },
            }}
            target="_blank"
          >
            Withdraw
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            id="path"
            label="HD Path"
            value={serializePath(pathParts)}
            enableCopy
            isMonospace
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
            isMonospace
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="pub"
            label="Public Key"
            value={publicKey}
            enableQr
            enableCopy
            isMonospace
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
            isMonospace
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WalletDetails;
