import { useRouter } from "next/router";
import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { recoverKeysInput } from "../../schemas";
import { Layout } from "../components/Layout";
import { UploadWell } from "../components/UploadWell";
import { TextField } from "../components/TextField";
import { Box, Button, Grid, Typography, InputBase } from "@mui/material";
import { trpc } from "../lib/trpc";
import { readFileToBase64, readFileToText } from "../lib/readFile";

type FormData = z.infer<typeof recoverKeysInput>;

const Index: NextPageWithLayout = () => {
  const router = useRouter();

  const { mutateAsync: recoverKeys, isLoading } =
    trpc.recoverKeys.useMutation();

  const onSubmit = async (formData: FormData) => {
    console.info({ formData });

    router.push("/[assetId]", "/BTC");

    // const responseData = await recoverKeys({
    //   zip: formData.zip,
    //   passphrase: formData.passphrase,
    //   rsaKey: formData.rsaKey,
    //   rsaKeyPassphrase: formData.rsaKeyPassphrase,
    // });

    // console.info(responseData);
  };

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(recoverKeysInput),
  });

  const onDropBackupZip = async (file: File) =>
    setValue("zip", await readFileToBase64(file));

  const onDropRsaPrivateKey = async (file: File) =>
    setValue("rsaKey", await readFileToText(file));

  return (
    <Box
      component="form"
      height="100%"
      display="flex"
      flexDirection="column"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Typography variant="h1">Recover Fireblocks Workspace</Typography>
      <Typography variant="body1" paragraph>
        Recovery Utility can recover your Fireblocks assets if you lose access
        to your workspace. With your hard key recovery materials, you can derive
        private keys, check balances, and transfer assets to external wallets.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2} justifyContent="space-between">
            <Grid item>
              <Typography variant="h3">Recovery kit</Typography>
            </Grid>
            <Grid item>
              <Typography variant="h3">.ZIP</Typography>
            </Grid>
          </Grid>
          <UploadWell
            hasExistingFile={!!watch("zip")}
            error={errors.zip?.message}
            accept={{ "application/zip": [".zip"] }}
            onDrop={onDropBackupZip}
          />
        </Grid>
        <Grid item xs={6}>
          <Grid container spacing={2} justifyContent="space-between">
            <Grid item>
              <Typography variant="h3">RSA private key</Typography>
            </Grid>
            <Grid item>
              <Typography variant="h3">.PEM / .KEY</Typography>
            </Grid>
          </Grid>
          <UploadWell
            hasExistingFile={!!watch("rsaKey")}
            error={errors.rsaKey?.message}
            accept={{ "application/x-pem-file": [".key", ".pem"] }}
            onDrop={onDropRsaPrivateKey}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="passphrase"
            type="password"
            label="Mobile passphrase"
            error={errors.passphrase?.message}
            {...register("passphrase")}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="rsaKeyPassphrase"
            type="password"
            label="RSA key passphrase"
            error={errors.rsaKeyPassphrase?.message}
            {...register("rsaKeyPassphrase")}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{
          margin: "auto 0 0 auto",
        }}
      >
        Recover
      </Button>
    </Box>
  );
};

Index.getLayout = (page: ReactElement) => <Layout hideSidebar>{page}</Layout>;

export default Index;
