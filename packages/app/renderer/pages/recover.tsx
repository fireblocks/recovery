import { useRouter } from "next/router";
import type { NextPageWithLayout } from "./_app";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { recoverKeysInput } from "../lib/schemas";
import { recoverKeys } from "../lib/pythonClient";
import { Layout } from "../components/Layout";
import { UploadWell } from "../components/UploadWell";
import { TextField, Button } from "shared";
import { Box, Grid, Typography } from "@mui/material";
import { readFileToBase64 } from "../lib/readFile";

type FormData = z.infer<typeof recoverKeysInput>;

const Recover: NextPageWithLayout = () => {
  const router = useRouter();

  const verifyOnly = router.query.verifyOnly === "true";

  const recoverMutation = useMutation({
    mutationFn: recoverKeys,
    onSuccess: () =>
      router.push(verifyOnly ? "/keys?verifyOnly=true" : "/assets"),
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
      display="flex"
      flexDirection="column"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Typography variant="h1">
        {verifyOnly ? "Verify Recovery Kit" : "Recover Private Keys"}
      </Typography>
      <Typography
        variant="body1"
        color={(theme) => theme.palette.error.main}
        paragraph
      >
        Recovering private keys exposes your Fireblocks extended private keys
        and derived asset private keys to this system&apos;s memory. This should
        only be done in a disaster recovery scenario. Do not recover private
        keys for usual business operations.
      </Typography>
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

Recover.getLayout = (page) => (
  <Layout hideNavigation hideSidebar>
    {page}
  </Layout>
);

export default Recover;
