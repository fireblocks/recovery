import type { NextPageWithLayout } from "./_app";
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

type FormData = z.infer<typeof decryptInput>;

const Index: NextPageWithLayout = () => {
  const { state, encodedPayload, assetId, privateKey, handleUrlPayload } =
    useWallet();

  console.info({ state, encodedPayload, assetId, privateKey });

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

  const onSubmit = async (formData: FormData) =>
    handleUrlPayload(encodedPayload as string, formData.passphrase);

  return (
    <Box
      height="100%"
      padding="1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="h1" marginBottom="1em">
        Fireblocks Recovery Relay
      </Typography>
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
          <Grid item flex={1} maxWidth="300px">
            <TextField
              id="passphrase"
              type="password"
              label="Relay Passphrase"
              helpText="Set in Fireblocks Recovery Utility Settings"
              error={errors.passphrase?.message}
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
                <Button type="submit">Decrypt Key</Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  component={NextLinkComposed}
                  to="/scan"
                >
                  Scan
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      {state === "ready" && (
        <Typography
          component="pre"
          sx={{
            whiteSpace: "pre-wrap",
            border: (theme) => `solid 1px ${theme.palette.primary.main}`,
            borderRadius: "10px",
            padding: "1em",
            fontFamily: monospaceFontFamily,
          }}
        >
          {JSON.stringify({ assetId, privateKey }, null, 2)}
        </Typography>
      )}
    </Box>
  );
};

export default Index;
