import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, QrCode, settingsInput, theme, monospaceFontFamily } from '@fireblocks/recovery-shared';
import { Box, Grid, Typography } from '@mui/material';
import walletDerivationPackage from '@fireblocks/wallet-derivation/package.json';
import extendedKeyRecoveryPackage from '@fireblocks/extended-key-recovery/package.json';
import utilityPackage from '../../package.json';
import { useSettings, defaultSettings } from '../context/Settings';
import { useWorkspace } from '../context/Workspace';

type FormData = z.infer<typeof settingsInput>;

const RELAY_SOURCE_URL = 'github.com/fireblocks/recovery';

const Settings = () => {
  const { idleMinutes, relayBaseUrl, saveSettings } = useSettings();

  const { reset: resetWorkspace } = useWorkspace();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(settingsInput),
    defaultValues: {
      idleMinutes,
      relayBaseUrl,
    },
  });

  const onSubmit = async (formData: FormData) => saveSettings(formData);

  return (
    <Box component='form' display='flex' height='100%' flexDirection='column' onSubmit={handleSubmit(onSubmit)}>
      <Typography variant='h1'>Settings</Typography>
      <Grid container spacing={2} paddingBottom='1rem'>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant='h2'>Reset</Typography>
              <Button type='submit' size='large' variant='outlined' fullWidth color='error' onClick={resetWorkspace}>
                Reset Workspace & Keys
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Typography variant='h2'>Auto Reset (minutes)</Typography>
              <TextField
                id='idleMinutes'
                type='number'
                placeholder={defaultSettings.idleMinutes.toString()}
                helpText='Resets when this system is inactive.'
                error={errors.idleMinutes?.message}
                {...register('idleMinutes', { valueAsNumber: true })}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant='h2'>Recovery Relay</Typography>
          <Grid container spacing={2}>
            <Grid item xs={9}>
              <TextField
                id='relayBaseUrl'
                type='url'
                label='Base URL'
                placeholder={defaultSettings.relayBaseUrl}
                helpText='You can host your own Recovery Relay. See source at github.com/fireblocks/recovery. DO NOT USE RELAY URLS FROM UNTRUSTED PARTIES!'
                error={errors.relayBaseUrl?.message}
                {...register('relayBaseUrl')}
              />
            </Grid>
            <Grid item xs={3}>
              <Typography fontWeight='500' color={(t) => t.palette.grey[900]} marginBottom='0.25rem'>
                Source Code
              </Typography>
              <QrCode
                data={`https://${RELAY_SOURCE_URL}`}
                showRawData={false}
                width='100%'
                bgColor={theme.palette.background.paper}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} marginTop='1rem'>
          <Grid container spacing={2} alignItems='center' justifyContent='flex-end'>
            <Grid item>
              <Button type='submit' color='primary'>
                Save
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant='h2'>Updates</Typography>
          <Grid container spacing={2}>
            <Grid item xs={9}>
              <Typography variant='body1' paragraph>
                Recovery Utility is for air-gapped devices and should be manually updated from the Fireblocks Help Center at
                support.fireblocks.io or {`${RELAY_SOURCE_URL}/releases`}.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant='caption' paragraph>
                    Recovery Utility<Typography fontFamily={monospaceFontFamily}>{utilityPackage.version}</Typography>
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant='caption' paragraph>
                    Wallet Derivation<Typography fontFamily={monospaceFontFamily}>{walletDerivationPackage.version}</Typography>
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant='caption' paragraph>
                    Extended Key Recovery
                    <Typography fontFamily={monospaceFontFamily}>{extendedKeyRecoveryPackage.version}</Typography>
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={3}>
              <Typography fontWeight='500' color={(t) => t.palette.grey[900]} marginBottom='0.25rem'>
                Latest Release
              </Typography>
              <QrCode
                data={`https://${RELAY_SOURCE_URL}/releases`}
                showRawData={false}
                width='100%'
                bgColor={theme.palette.background.paper}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
