import { NextLinkComposed } from "../components/Link";
import { Box, Button, Grid, Typography } from "@mui/material";
import { Logo } from "../components/Layout/components/Header/components/Logo";

const Index = () => {
  return (
    <Grid
      container
      spacing={2}
      alignItems="center"
      height="100%"
      padding="1rem"
    >
      <Grid item xs={6}>
        <Typography sx={{ color: (theme) => theme.palette.primary.main }}>
          <Logo width={150} />
        </Typography>
        <Typography variant="h1">Recovery Utility</Typography>
        <Typography variant="body1" paragraph>
          Recovery Utility can help you start a backup of your Fireblocks
          workspace or recover your assets. With your hard key recovery
          materials, you can recover your master extended keys, derive wallet
          keys and addresses, and build transactions for broadcasting with an
          online device.
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              size="large"
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              component={NextLinkComposed}
              to="/backup"
              disabled
            >
              Start Back Up
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              size="large"
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              component={NextLinkComposed}
              to="/recover"
            >
              Recover
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
