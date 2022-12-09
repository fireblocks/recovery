import type { NextPageWithLayout } from "./_app";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { decryptInput } from "../lib/schemas";
import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import {
  TextField,
  Button,
  NextLinkComposed,
  monospaceFontFamily,
} from "styles";
import { useWallet } from "../context/Wallet";
import { Logo } from "../components/Logo";

type FormData = z.infer<typeof decryptInput>;

const Index: NextPageWithLayout = () => {
  const { state, assetId, privateKey, handlePassphrase } = useWallet();

  const [decryptionError, setDecryptionError] = useState<string | undefined>(
    undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(decryptInput),
    defaultValues: {
      passphrase: "",
    },
  });

  const onSubmit = (formData: FormData) => {
    try {
      handlePassphrase(formData.passphrase);

      setDecryptionError(undefined);
    } catch {
      setDecryptionError("Invalid passphrase");
    }
  };

  return (
    <Box
      height="100%"
      padding="1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Logo marginBottom="2em" />
      {state === "init" && <CircularProgress size="48px" />}
      {state === "encrypted" && (
        <Grid
          component="form"
          container
          spacing={2}
          alignItems="center"
          justifyContent="center"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Grid item flex={1} maxWidth="350px">
            <TextField
              id="passphrase"
              type="password"
              label="Relay Passphrase"
              helpText="Set in Fireblocks Recovery Utility Settings"
              error={errors.passphrase?.message ?? decryptionError}
              autoFocus
              {...register("passphrase")}
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <Grid
              container
              spacing={2}
              alignItems="center"
              justifyContent="center"
            >
              <Grid item>
                <Button type="submit">Decrypt Wallet</Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  component={NextLinkComposed}
                  to="/scan"
                >
                  Scan Code
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      {state === "ready" && (
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={12}>
            <TextField
              id="assetId"
              label="Asset ID"
              value={assetId}
              enableCopy
              isMonospace
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="privateKey"
              type="password"
              label="Private Key"
              value={privateKey}
              enableCopy
              isMonospace
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Index;
