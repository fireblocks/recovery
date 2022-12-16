import { useRouter } from "next/router";
import type { NextPageWithLayout } from "./_app";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { recoverKeysInput } from "../lib/schemas";
import { recoverKeys } from "../lib/pythonClient";
import { useWorkspace } from "../context/Workspace";
import { Layout } from "../components/Layout";
import { UploadWell } from "../components/UploadWell";
import { TextField, Button } from "shared";
import { Box, Grid, Typography } from "@mui/material";
import { readFileToBase64 } from "../lib/readFile";

type FormData = z.infer<typeof recoverKeysInput>;

const Recover: NextPageWithLayout = () => {
  const router = useRouter();

  const { resetWorkspace } = useWorkspace();

  const [recoveryError, setRecoveryError] = useState<string | undefined>(
    undefined
  );

  const verifyOnly = router.query.verifyOnly === "true";

  const recoverMutation = useMutation({
    mutationFn: recoverKeys,
    onSuccess: () => {
      setRecoveryError(undefined);

      resetWorkspace(true);

      router.push(verifyOnly ? "/keys?verifyOnly=true" : "/assets");
    },
    onError: (error) => {
      console.error(error);

      setRecoveryError((error as Error).message);
    },
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
      height="100%"
      component="form"
      display="flex"
      flexDirection="column"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Typography variant="h1">
        {verifyOnly ? "Verify Recovery Kit" : "Recover Private Keys"}
      </Typography>
      {verifyOnly ? (
        <>
          <Typography variant="body1" paragraph>
            Verify a Recovery Kit to ensure that you can access your Fireblocks
            assets in a disaster scenario.
          </Typography>
          <Typography variant="body1" paragraph>
            Check that the recovered Fireblocks extended public keys match the
            keys in your Fireblocks Console Settings.
          </Typography>
          <Typography variant="body1" paragraph>
            This does not expose your private keys.
          </Typography>
        </>
      ) : (
        <Typography
          variant="body1"
          color={(theme) => theme.palette.error.main}
          paragraph
        >
          Using private key recovery exposes your private keys to this system.
          Only do this in a disaster recovery scenario, and then move your
          assets to other secure wallets. Use the Fireblocks Console, APIs, and
          SDKs for standard operations.
        </Typography>
      )}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2} justifyContent="space-between">
            <Grid item>
              <Typography variant="h3">Recovery Kit</Typography>
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
              <Typography variant="h3">RSA Private Key</Typography>
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
            label="Mobile App Passphrase"
            error={errors.passphrase?.message}
            disabled={recoverMutation.isLoading}
            {...register("passphrase")}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="rsaKeyPassphrase"
            type="password"
            label="RSA Key Passphrase"
            error={errors.rsaKeyPassphrase?.message}
            disabled={recoverMutation.isLoading}
            {...register("rsaKeyPassphrase")}
          />
        </Grid>
      </Grid>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="flex-end"
        marginTop="auto"
      >
        <Grid item flex="1">
          <Typography
            variant="body1"
            fontWeight="600"
            color={(theme) => theme.palette.error.main}
          >
            {recoveryError}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            type="submit"
            color="primary"
            disabled={recoverMutation.isLoading}
          >
            {verifyOnly ? "Verify Recovery" : "Recover"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

Recover.getLayout = (page, router) => (
  <Layout showBack hideNavigation hideSidebar>
    {page}
  </Layout>
);

export default Recover;
