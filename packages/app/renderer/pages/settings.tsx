import type { NextPageWithLayout } from "./_app";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { settingsInput } from "../lib/schemas";
import { useSettings, defaultSettings } from "../context/Settings";
import { Layout } from "../components/Layout";
import { Button, TextField } from "shared";
import { Box, Grid, Typography } from "@mui/material";

type FormData = z.infer<typeof settingsInput>;

const Settings: NextPageWithLayout = () => {
  const { relayBaseUrl, saveSettings } = useSettings();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(settingsInput),
    defaultValues: {
      relayBaseUrl,
    },
  });

  const onSubmit = async (formData: FormData) => saveSettings(formData);

  return (
    <Box
      component="form"
      display="flex"
      flexDirection="column"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Typography variant="h1">Settings</Typography>

      <Typography variant="h2">Fireblocks Recovery Relay</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            id="relayBaseUrl"
            type="url"
            label="Base URL"
            placeholder={defaultSettings.relayBaseUrl}
            helpText="Use the default Fireblocks Recovery Relay URL or host your own."
            error={errors.relayBaseUrl?.message}
            {...register("relayBaseUrl")}
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
          <Button type="submit" color="primary">
            Save
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

Settings.getLayout = (page) => <Layout>{page}</Layout>;

export default Settings;
