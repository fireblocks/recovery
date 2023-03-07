import { useRouter } from "next/router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField, Button } from "@fireblocks/recovery-shared";
import { Box, Grid, Typography } from "@mui/material";
import { recoverKeysInput } from "../lib/schemas";
import { useWorkspace } from "../context/Workspace";
import { Layout } from "../components/Layout";
import { UploadWell } from "../components/UploadWell";
import type { NextPageWithLayout } from "./_app";
import { readFileToBase64 } from "../lib/readFile";
import { recoverExtendedKeys } from "../lib/ipc";

type FormData = z.infer<typeof recoverKeysInput>;

const Recover: NextPageWithLayout = () => {
  const router = useRouter();

  const { restoreVaultAccounts, setExtendedKeys } = useWorkspace();

  const [recoveryError, setRecoveryError] = useState<string | undefined>(
    undefined
  );

  const verifyOnly = router.query.verifyOnly === "true";

  const recoverMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      recoverExtendedKeys({
        zip: formData.backupZip,
        mobilePassphrase: formData.passphrase,
        rsaKey: formData.rsaKey,
        rsaKeyPassphrase: formData.rsaKeyPassphrase,
        dangerouslyRecoverPrivateKeys: !verifyOnly,
      }),
    onSuccess: async (extendedKeys, { backupCsv }) => {
      setRecoveryError(undefined);

      setExtendedKeys(extendedKeys);

      if (backupCsv) {
        await restoreVaultAccounts(backupCsv, extendedKeys);
      }

      router.push({
        pathname: verifyOnly ? "/keys" : "/accounts/vault",
        query: { verifyOnly: verifyOnly ? "true" : undefined },
      });
    },
    onError: (error) => {
      console.error(error);

      setRecoveryError(
        error instanceof Error ? error.message : (error as string)
      );
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
    defaultValues: {
      backupCsv: null,
      backupZip: "",
      rsaKey: "",
      passphrase: "",
      rsaKeyPassphrase: "",
    },
  });

  const [backupCsv, backupZip, rsaKey] = watch([
    "backupCsv",
    "backupZip",
    "rsaKey",
  ]);

  const onDropBackupZip = async (file: File) =>
    setValue("backupZip", await readFileToBase64(file));

  const onDropRsaPrivateKey = async (file: File) =>
    setValue("rsaKey", await readFileToBase64(file));

  const onDropVaultAddressesCsv = async (file: File) => {
    try {
      setValue("backupCsv", file);
    } catch (error) {
      setRecoveryError(
        error instanceof Error ? error.message : (error as string)
      );

      setValue("backupCsv", null);
    }
  };

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
        <Grid item xs={verifyOnly ? 6 : 4}>
          <UploadWell
            label="Recovery Kit"
            error={errors.backupZip?.message}
            hasFile={!!backupZip}
            accept={{ "application/zip": [".zip"] }}
            disabled={recoverMutation.isLoading}
            onDrop={onDropBackupZip}
          />
          <TextField
            id="passphrase"
            type="password"
            label="Mobile App Recovery Passphrase"
            helpText="Set by the workspace owner in onboarding"
            error={errors.passphrase?.message}
            disabled={recoverMutation.isLoading}
            {...register("passphrase")}
          />
        </Grid>
        <Grid item xs={verifyOnly ? 6 : 4}>
          <UploadWell
            label="Recovery Private Key"
            error={errors.rsaKey?.message}
            hasFile={!!rsaKey}
            accept={{ "application/x-pem-file": [".key", ".pem"] }}
            disabled={recoverMutation.isLoading}
            onDrop={onDropRsaPrivateKey}
          />
          <TextField
            id="rsaKeyPassphrase"
            type="password"
            label="Recovery Private Key Passphrase"
            error={errors.rsaKeyPassphrase?.message}
            disabled={recoverMutation.isLoading}
            {...register("rsaKeyPassphrase")}
          />
        </Grid>
        {!verifyOnly && (
          <Grid item xs={4}>
            <UploadWell
              label="Exported Addresses (Optional)"
              error={errors.backupCsv?.message}
              hasFile={!!backupCsv}
              accept={{ "text/csv": [".csv"] }}
              disabled={recoverMutation.isLoading}
              onDrop={onDropVaultAddressesCsv}
            />
          </Grid>
        )}
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

Recover.getLayout = (page) => (
  <Layout showBack hideNavigation>
    {page}
  </Layout>
);

export default Recover;
