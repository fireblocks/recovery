import { useRouter } from 'next/router';
import { monospaceFontFamily, TextField, Button, extendedKeys as extendedKeysInput } from '@fireblocks/recovery-shared';
import { Box, Grid, Typography, InputAdornment } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import type { NextPageWithLayout } from './_app';
import { useWorkspace } from '../context/Workspace';
import { Layout } from '../components/Layout';

type FormData = z.infer<typeof extendedKeysInput>;

const Verify: NextPageWithLayout = () => {
  const router = useRouter();

  const { extendedKeys, setExtendedKeys } = useWorkspace();

  const showPrivate = !!extendedKeys?.xprv && !!extendedKeys.fprv;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(extendedKeysInput),
    defaultValues: { ...extendedKeys },
  });

  console.info({ errors });

  // TODO: Validate extended keys with Python module
  const onSubmit = (data: FormData) => {
    console.info(data);

    setExtendedKeys(data);

    router.push('/accounts/vault');
  };

  return (
    <Box component='form' height='100%' display='flex' flexDirection='column' onSubmit={handleSubmit(onSubmit)}>
      <Typography variant='h1'>Extended {showPrivate ? '' : 'Public '}Keys</Typography>
      {(!!extendedKeys?.xpub || !!extendedKeys?.fpub) && (
        <Typography variant='body1' paragraph>
          Check that the recovered Fireblocks extended public keys match the keys in your Fireblocks Console Settings.
        </Typography>
      )}
      <Typography variant='body1' paragraph>
        Addresses, public keys, and private keys of all of Fireblocks wallets are derived from extended public and private keys.
      </Typography>
      <Typography variant='body1' paragraph>
        ECDSA extended keys (
        <Typography component='span' fontFamily={monospaceFontFamily}>
          xpub/xprv
        </Typography>
        ) can be used with wallet software that imports BIP32 extended private keys. Fireblocks Ed25519 extended keys (
        <Typography component='span' fontFamily={monospaceFontFamily}>
          fpub/fprv
        </Typography>
        ) are Fireblocks-specific and can only be used by Fireblocks software.
      </Typography>
      {(!extendedKeys?.xpub || !extendedKeys?.fpub) && (
        <Typography variant='body1' paragraph>
          Set your extended public keys (
          <Typography component='span' fontFamily={monospaceFontFamily}>
            xpub/fpub
          </Typography>
          ) to derive wallet addresses and public keys for recovery verification. In a disaster recovery scenario, you can set
          your private keys (
          <Typography component='span' fontFamily={monospaceFontFamily}>
            xprv/fprv
          </Typography>
          ) to derive wallet private keys and sign transactions. <Link href='/recover'>Use your Recovery Kit</Link> to obtain your
          private keys.
        </Typography>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant='h2' marginBottom='0'>
            Public Keys
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <TextField
            id='xpub'
            label='xpub (ECDSA)'
            error={errors.xpub?.message}
            enableCopy={!!extendedKeys?.xpub}
            isMonospace
            endAdornment={
              extendedKeys?.xpub && extendedKeys.xprv ? (
                <InputAdornment position='end'>
                  <CheckCircle color='success' sx={{ marginRight: '0.25rem' }} />
                  Valid
                </InputAdornment>
              ) : null
            }
            {...register('xpub')}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            id='fpub'
            label='fpub (Fireblocks Ed25519)'
            error={errors.fpub?.message}
            enableCopy={!!extendedKeys?.fpub}
            isMonospace
            endAdornment={
              extendedKeys?.fpub && extendedKeys.fprv ? (
                <InputAdornment position='end'>
                  <CheckCircle color='success' sx={{ marginRight: '0.25rem' }} />
                  Valid
                </InputAdornment>
              ) : null
            }
            {...register('fpub')}
          />
        </Grid>
        {showPrivate && (
          <>
            <Grid item xs={12}>
              <Typography variant='h2' marginBottom='0'>
                Private Keys
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                id='xprv'
                type='password'
                label='xprv (ECDSA)'
                error={errors.xprv?.message}
                enableCopy={!!extendedKeys?.xprv}
                isMonospace
                {...register('xprv')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id='fprv'
                type='password'
                label='fprv (Fireblocks Ed25519)'
                error={errors.fprv?.message}
                enableCopy={!!extendedKeys?.fprv}
                isMonospace
                {...register('fprv')}
              />
            </Grid>
          </>
        )}
      </Grid>
      <Grid container spacing={2} alignItems='center' justifyContent='flex-end' marginTop='auto'>
        <Grid item>
          <Button type='submit'>
            {showPrivate ? 'Recover' : 'Verify'} {extendedKeys ? 'Wallets' : 'Extended Keys'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

Verify.getLayout = (page) => <Layout>{page}</Layout>;

export default Verify;
