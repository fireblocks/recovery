import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, theme, monospaceFontFamily } from '@fireblocks/recovery-shared';
import { Box, Grid, Typography } from '@mui/material';
import walletDerivationPackage from '@fireblocks/wallet-derivation/package.json';
import { useSettings, defaultSettings, settingsInput, SettingsInput } from '../context/Settings';
import { useWorkspace } from '../context/Workspace';

const Settings = () => {
  const { rpcURLs, saveSettings } = useSettings();

  const { reset: resetWorkspace } = useWorkspace();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsInput),
    defaultValues: {
      rpcURLs,
    },
  });

  const onSubmit = async (formData: SettingsInput) => saveSettings(formData);

  return (
    <Box component='form' display='flex' height='100%' flexDirection='column' onSubmit={handleSubmit(onSubmit)}>
      <Typography variant='h1'>Settings</Typography>
      <Grid container spacing={2} paddingBottom='1rem'>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant='h2'>Reset</Typography>
              <Button type='submit' size='large' variant='outlined' fullWidth color='error' onClick={resetWorkspace}>
                Reset Workspace & Keys
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* RPC URLs */}

        <Grid item xs={12} marginTop='1rem'>
          <Grid container spacing={2} alignItems='center' justifyContent='flex-end'>
            <Grid item>
              <Button type='submit' color='primary'>
                Save
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
