import type { NextPageWithLayout } from "./_app";
import { Layout } from "../components/Layout";
import { Box, Typography } from "@mui/material";

const Settings: NextPageWithLayout = () => {
  return (
    <Box>
      <Typography variant="h1">Settings</Typography>
    </Box>
  );
};

Settings.getLayout = (page) => <Layout hideSidebar>{page}</Layout>;

export default Settings;
