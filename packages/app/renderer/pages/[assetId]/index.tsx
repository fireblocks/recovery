import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../_app";
import type { ReactElement } from "react";
import { Layout } from "../../components/Layout";
import { Box, Button, Grid, Typography, InputBase } from "@mui/material";
import { trpc } from "../../lib/trpc";

const Asset: NextPageWithLayout = () => {
  const router = useRouter();

  const assetId = router.query.assetId as string;

  const { mutateAsync: deriveKeys, isLoading } = trpc.deriveKeys.useMutation();

  return <Typography variant="h1">Asset: {assetId}</Typography>;
};

Asset.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Asset;
