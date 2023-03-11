import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, settingsInput, theme, monospaceFontFamily } from '@fireblocks/recovery-shared';
import { Box, Grid, Typography } from '@mui/material';
import { version as relayVersion } from '@fireblocks/recovery-relay/package.json';
import { version as walletDerivationVersion } from '@fireblocks/wallet-derivation/package.json';
import { version as extendedKeyRecoveryVersion } from '@fireblocks/extended-key-recovery/package.json';
import { useSettings, defaultSettings } from '../context/Settings';
import { Layout } from '../components/Layout';
import type { NextPageWithLayout } from './_app';
import { QrCode } from '../components/QrCode';
import { version as utilityVersion } from '../../package.json';

type FormData = z.infer<typeof settingsInput>;

const RELAY_SOURCE_URL = 'github.com/fireblocks/recovery';

const Settings: NextPageWithLayout = () => {
  const { idleMinutes, relayBaseUrl, saveSettings } = useSettings();

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
      <Typography variant='h2'>Auto Lock</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            id='idleMinutes'
            type='number'
            label='Idle Minutes'
            placeholder={defaultSettings.idleMinutes.toString()}
            helpText='Automatically lock the app after a period of inactivity.'
            error={errors.idleMinutes?.message}
            {...register('idleMinutes', { valueAsNumber: true })}
          />
        </Grid>
      </Grid>
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
      <Typography variant='h2'>Updates</Typography>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <Typography variant='body1' paragraph>
            Recovery Utility is for air-gapped devices and should be manually updated from the Fireblocks Help Center at
            support.fireblocks.io or {`${RELAY_SOURCE_URL}/releases`}.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant='caption' paragraph>
                Recovery Utility<Typography fontFamily={monospaceFontFamily}>{utilityVersion}</Typography>
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant='caption' paragraph>
                Recovery Relay<Typography fontFamily={monospaceFontFamily}>{relayVersion}</Typography>
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant='caption' paragraph>
                Wallet Derivation<Typography fontFamily={monospaceFontFamily}>{walletDerivationVersion}</Typography>
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant='caption' paragraph>
                X-Key Recovery<Typography fontFamily={monospaceFontFamily}>{extendedKeyRecoveryVersion}</Typography>
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

      <Grid container spacing={2} alignItems='center' justifyContent='flex-end' marginTop='2rem' paddingBottom='1rem'>
        <Grid item>
          <Button type='submit' color='primary'>
            Save
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

Settings.getLayout = (page) => <Layout>{page}</Layout>;

export default Settings;
