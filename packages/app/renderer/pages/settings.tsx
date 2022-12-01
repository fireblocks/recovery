import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { Layout } from "../components/Layout";
import { Box, Typography } from "@mui/material";

const Settings: NextPageWithLayout = () => {
  return (
    <Box>
      <Typography variant="h1">Settings</Typography>
    </Box>
  );
};

Settings.getLayout = (page: ReactElement) => (
  <Layout hideSidebar>{page}</Layout>
);

export default Settings;
