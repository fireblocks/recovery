import type { NextPageWithLayout } from "../_app";
import { Box, Grid } from "@mui/material";
import { TextField } from "styles";
import { useWallet } from "../../context/Wallet";
import { Logo } from "../../components/Logo";

const Wallet: NextPageWithLayout = () => {
  const { assetId, privateKey } = useWallet();

  return (
    <Box
      height="100%"
      padding="1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Logo marginBottom="2em" />
      <Grid
        maxWidth="600px"
        container
        spacing={2}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={12}>
          <TextField
            id="assetId"
            label="Asset ID"
            value={assetId}
            enableCopy
            isMonospace
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="privateKey"
            type="password"
            label="Private Key"
            value={privateKey}
            enableCopy
            isMonospace
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Wallet;
