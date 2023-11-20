import React from 'react';
import { useRouter } from 'next/router';
import { Box, Grid, Typography, InputAdornment } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { monospaceFontFamily } from '../theme';
import { Link } from '../components/Link';
import { TextField, Button } from '../components';
import { extendedKeys as extendedKeysInput } from '../schemas';

type FormData = z.infer<typeof extendedKeysInput>;

type Props = {
  supportsPrivateKeys: boolean;
  extendedKeys?: FormData;
  setExtendedKeys: (data: FormData) => void;
};

export const ExtendedKeysBasePage = ({ supportsPrivateKeys, extendedKeys, setExtendedKeys }: Props) => {
  const router = useRouter();

  const hasExtendedPublicKeys = !!extendedKeys?.xpub || !!extendedKeys?.fpub;
  const hasExtendedPrivateKeys = !!extendedKeys?.xprv || !!extendedKeys?.fprv;
  const showPrivate = supportsPrivateKeys && hasExtendedPrivateKeys;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(extendedKeysInput),
    defaultValues: {
      xpub: extendedKeys?.xpub,
      fpub: extendedKeys?.fpub,
      ...(supportsPrivateKeys && {
        xprv: extendedKeys?.xprv,
        fprv: extendedKeys?.fprv,
      }),
    },
  });

  console.info({ errors });

  const onSubmit = (data: FormData) => {
    console.info(data);

    setExtendedKeys(data);

    router.push('/accounts/vault');
  };

  return (
    <Box component='form' height='100%' display='flex' flexDirection='column' onSubmit={handleSubmit(onSubmit)}>
      <Typography variant='h1'>Extended {showPrivate ? '' : 'Public '}Keys</Typography>
      {hasExtendedPublicKeys && (
        <Typography variant='body1' paragraph>
          Check that the recovered Fireblocks extended public keys match the keys in your Fireblocks Console Settings.
        </Typography>
      )}
      <Typography variant='body1' paragraph>
        Addresses, public keys, and private keys of all of Fireblocks wallets are derived from your workspace's extended public
        and private key.
      </Typography>
      <Typography variant='body1' paragraph>
        ECDSA extended keys (
        <Typography component='span' fontFamily={monospaceFontFamily}>
          xpub/xprv
        </Typography>
        ) can be used with wallet software that imports BIP32 extended private keys. Fireblocks EdDSA extended keys (
        <Typography component='span' fontFamily={monospaceFontFamily}>
          fpub/fprv
        </Typography>
        ) are Fireblocks-specific and can only be used by Fireblocks software.
      </Typography>
      {!hasExtendedPublicKeys && (
        <Typography variant='body1' paragraph>
          Set your extended public keys (
          <Typography component='span' fontFamily={monospaceFontFamily}>
            xpub/fpub
          </Typography>
          ) to derive wallet addresses and public keys for recovery verification.
          {supportsPrivateKeys && (
            <>
              {' '}
              In a disaster recovery scenario, you can set your private keys (
              <Typography component='span' fontFamily={monospaceFontFamily}>
                xprv/fprv
              </Typography>
              ) to derive wallet private keys and sign transactions. <Link href='/recover'>Use your Recovery Kit</Link> to obtain
              your private keys.
            </>
          )}
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
            value={extendedKeys?.xpub}
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
            label='fpub (Fireblocks EdDSA)'
            error={errors.fpub?.message}
            enableCopy={!!extendedKeys?.fpub}
            value={extendedKeys?.fpub}
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
        {hasExtendedPrivateKeys && (
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
                confirmRequired={true}
                confirmMessage='WARNING - You are about to reveal your extended private key (ECDSA). Make sure this machine is OFFLINE and only accessible by authorized personnel.'
                {...register('xprv')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id='fprv'
                type='password'
                label='fprv (Fireblocks EdDSA)'
                error={errors.fprv?.message}
                enableCopy={!!extendedKeys?.fprv}
                isMonospace
                confirmRequired={true}
                confirmMessage='WARNING - You are about to reveal your extended private key (EDDSA). Make sure this machine is OFFLINE and only accessible by authorized personnel.'
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
