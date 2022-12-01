import { useState } from "react";
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
import { Box, Button, Grid, Typography } from "@mui/material";
import { readFileToBase64, readFileToText } from "../lib/readFile";

type FormData = z.infer<typeof recoverKeysInput>;

type RecoverKeysResponse = {
  xprv: string;
  fprv: string;
  xpub: string;
  fpub: string;
};

const Recover: NextPageWithLayout = () => {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // const recoverKeysMutation = trpc.recoverKeys.useMutation();
  // const isSubmitting = recoverKeysMutation.isLoading

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      const encodedFormData = new FormData();
      encodedFormData.append("zip", "");
      encodedFormData.append("passphrase", "");
      encodedFormData.append("rsa-key", "");
      encodedFormData.append("rsa-key-passphrase", "");

      // TODO: USE DYNAMIC PORT
      const res = await fetch("http://localhost:8000/recover-keys", {
        method: "POST",
        body: encodedFormData,
      });

      const data = (await res.json()) as RecoverKeysResponse;

      console.info("Recover keys response:", data);
    } catch (err) {
      setIsSubmitting(false);
      const error = err as Error;
      console.error("Recover keys error:", error.message);
    }

    router.push("/wallets/[assetId]", "/wallets/BTC");
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
            hasFile={!!watch("zip")}
            error={errors.zip?.message}
            accept={{ "application/zip": [".zip"] }}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            onDrop={onDropRsaPrivateKey}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="passphrase"
            type="password"
            label="Mobile passphrase"
            error={errors.passphrase?.message}
            disabled={isSubmitting}
            {...register("passphrase")}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="rsaKeyPassphrase"
            type="password"
            label="RSA key passphrase"
            error={errors.rsaKeyPassphrase?.message}
            disabled={isSubmitting}
            {...register("rsaKeyPassphrase")}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting}
        sx={{ margin: "auto 0 0 auto" }}
      >
        Recover
      </Button>
    </Box>
  );
};

Recover.getLayout = (page: ReactElement) => <Layout hideSidebar>{page}</Layout>;

export default Recover;
