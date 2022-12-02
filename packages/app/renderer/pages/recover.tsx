import { useRouter } from "next/router";
import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { recoverKeysInput } from "../lib/schemas";
import { Layout } from "../components/Layout";
import { UploadWell } from "../components/UploadWell";
import { TextField } from "../components/TextField";
import { Box, Button, Grid, Typography } from "@mui/material";
import { readFileToBase64 } from "../lib/readFile";

type FormData = z.infer<typeof recoverKeysInput>;

type RecoverKeysResponse = {
  xprv: string;
  fprv: string;
  xpub: string;
  fpub: string;
};

const recoverKeys = async (formData: FormData) => {
  // TODO: USE DYNAMIC PORT
  const res = await fetch(
    "http://localhost:8000/recover-keys?recover-prv=true",
    {
      method: "POST",
      body: JSON.stringify({
        zip: formData.zip,
        passphrase: formData.passphrase,
        "rsa-key": formData.rsaKey,
        "rsa-key-passphrase": formData.rsaKeyPassphrase,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const keyData = (await res.json()) as RecoverKeysResponse;

  return keyData;
};

const Recover: NextPageWithLayout = () => {
  const router = useRouter();

  const recoverMutation = useMutation({
    mutationFn: recoverKeys,
    onSuccess: () => router.push("/wallets/[assetId]", "/wallets/BTC"),
  });

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
    setValue("rsaKey", await readFileToBase64(file));

  const onSubmit = (formData: FormData) => recoverMutation.mutate(formData);

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
            hasFile={!!watch("zip")}
            error={errors.zip?.message}
            accept={{ "application/zip": [".zip"] }}
            disabled={recoverMutation.isLoading}
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
            hasFile={!!watch("rsaKey")}
            error={errors.rsaKey?.message}
            accept={{ "application/x-pem-file": [".key", ".pem"] }}
            disabled={recoverMutation.isLoading}
            onDrop={onDropRsaPrivateKey}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="passphrase"
            type="password"
            label="Mobile passphrase"
            error={errors.passphrase?.message}
            disabled={recoverMutation.isLoading}
            {...register("passphrase")}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="rsaKeyPassphrase"
            type="password"
            label="RSA key passphrase"
            error={errors.rsaKeyPassphrase?.message}
            disabled={recoverMutation.isLoading}
            {...register("rsaKeyPassphrase")}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={recoverMutation.isLoading}
        sx={{ margin: "auto 0 0 auto" }}
      >
        Recover
      </Button>
    </Box>
  );
};

Recover.getLayout = (page: ReactElement) => <Layout hideSidebar>{page}</Layout>;

export default Recover;
