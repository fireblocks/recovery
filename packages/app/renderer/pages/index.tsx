import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { Layout } from "../components/Layout";
import { LogoHero, Button, NextLinkComposed } from "shared";
import { Grid } from "@mui/material";

const Index: NextPageWithLayout = () => {
  return (
    <Grid container spacing={2} alignItems="center" height="100%" padding="rem">
      <Grid item xs={6}>
        <LogoHero
          title="Recovery Utility"
          description="Recover Fireblocks private keys and assets, verify a recovery kit, or build keys to set up a new recovery kit."
        />
      </Grid>
      <Grid item xs={6}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              size="large"
              variant="outlined"
              fullWidth
              component={NextLinkComposed}
              to="/setup"
            >
              Setup Recovery Kit
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              size="large"
              variant="outlined"
              fullWidth
              component={NextLinkComposed}
              to="/recover?verifyOnly=true"
            >
              Verify Recovery Kit
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              size="large"
              color="primary"
              fullWidth
              component={NextLinkComposed}
              to="/recover"
            >
              Recover Private Keys
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

Index.getLayout = (page: ReactElement) => (
  <Layout hideHeader hideSidebar>
    {page}
  </Layout>
);

export default Index;
