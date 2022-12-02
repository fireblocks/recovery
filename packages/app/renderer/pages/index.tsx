import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { Layout } from "../components/Layout";
import { NextLinkComposed } from "../components/Link";
import { Logo } from "../components/Logo";
import { Box, Grid, Typography, Button } from "@mui/material";
import { Restore } from "@mui/icons-material";

const Index: NextPageWithLayout = () => {
  return (
    <Grid container spacing={2} alignItems="center" height="100%" padding="rem">
      <Grid item xs={6}>
        <Typography sx={{ color: (theme) => theme.palette.primary.main }}>
          <Logo width={150} />
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography
            variant="h1"
            marginTop={0}
            lineHeight={0}
            marginRight="8px"
          >
            <Restore />
          </Typography>
          <Typography variant="h1" marginTop={0.3}>
            Recovery Utility
          </Typography>
        </Box>
        <Typography variant="body1" paragraph gutterBottom={false}>
          Recovery Utility can help recover your Fireblocks workspace, verify a
          recovery, or build keys for hard key recovery setup.
        </Typography>
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
              Recovery Setup
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
              Verify Recovery
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              size="large"
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

Index.getLayout = (page: ReactElement) => (
  <Layout hideHeader hideSidebar>
    {page}
  </Layout>
);

export default Index;
