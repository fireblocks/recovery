import {
  NCWCsvFileInput,
  Button,
  NextLinkComposed,
  UploadWell,
  download,
  getLogger,
  ncwCsvFileInput,
  useWrappedState,
} from '@fireblocks/recovery-shared';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';
import { NCWallet, NCWalletShare } from '@fireblocks/wallet-derivation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Typography, Grid } from '@mui/material';
import { ParseError, parse } from 'papaparse';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useWorkspace } from '../context/Workspace';

const logger = getLogger(LOGGER_NAME_UTILITY);

const NCW = () => {
  const { extendedKeys: { ncwMaster } = {} } = useWorkspace();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NCWCsvFileInput>({
    resolver: zodResolver(ncwCsvFileInput),
  });

  const [importError, setImportError] = useWrappedState<string | undefined>('ncwcsv-importError', undefined);
  const [derivedWalletKeys, setDerivedWalletKeys] = useState<{ [key: string]: NCWalletShare }>({});
  const [walletIdCsv] = watch(['walletIdsFile']);

  const onDropCsv = async (file: File) => {
    try {
      setValue('walletIdsFile', file);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : (error as string));

      setValue('walletIdsFile', undefined);
    }
  };

  if (!ncwMaster) {
    return (
      <Grid container spacing={2} flexDirection='column' alignItems='center' justifyContent='center' height='100%'>
        <Grid item>
          <Typography variant='h1'>Non Custodial Wallets</Typography>
        </Grid>
        <Grid item>
          <Typography paragraph variant='body1' textAlign='center'>
            You need to perform partial recovery before before being able to get your end user wallet key shares.
          </Typography>
        </Grid>
        <Grid item>
          <Button component={NextLinkComposed} to='/'>
            Recover
          </Button>
        </Grid>
      </Grid>
    );
  }

  // euw = End User Wallet
  const euWallet = new NCWallet(ncwMaster!);

  const onSubmit = async (formData: NCWCsvFileInput) => {
    parse<{ 'Wallet Id': string }>(formData.walletIdsFile!, {
      worker: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      fastMode: true,
      step: ({ data, errors: parseErrors }) => {
        logger.debug('ncw CSV Import', { data });
        if (parseErrors.length > 0) {
          parseErrors.forEach((pE: ParseError) => {
            logger.error(`Faced errors when trying to parse NCW CSV: ${pE}`);
          });
          throw new Error(parseErrors[0].message);
        }

        const walletId = data['Wallet Id'];
        try {
          setDerivedWalletKeys((prev) => ({ ...prev, [walletId]: euWallet.derivePrivateKey(walletId, 'MPC_ECDSA_SECP256K1') }));
        } catch (e) {
          logger.error('Failed to derive wallet for wallet id:', walletId, e);
          throw e;
        }
      },
      error: (e: Error) => {
        logger.error('Failed to derive wallet', e);
        throw e;
      },
    });
  };

  const exportAddresses = () => {
    download(
      Buffer.from(JSON.stringify(derivedWalletKeys)),
      `derive_wallet_key_shares_${Math.floor(Date.now() / 1000)}.json`,
      'application/json',
    );
  };

  return (
    <Box height='100%' display='flex' flexDirection='column'>
      <Typography variant='h1'>Import NCW Wallet Ids</Typography>
      <form onSubmit={handleSubmit(onSubmit, logger.error)}>
        <Typography variant='h2'>Import</Typography>
        <Typography variant='body1' paragraph>
          Import wallet ids CSV, this CSV must have a single column called `Wallet Id`.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <UploadWell
              label='Wallet IDs'
              error={errors.walletIdsFile?.message}
              hasFile={!!walletIdCsv}
              accept={{ 'text/csv': ['.csv'] }}
              onDrop={onDropCsv}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} alignItems='center'>
          <Grid item flex='1'>
            <Typography variant='body1' fontWeight='600' color={(theme) => theme.palette.error.main}>
              {importError}
            </Typography>
          </Grid>
          <Grid item>
            <Button type='submit' color='primary' disabled={!walletIdCsv}>
              Import
            </Button>
          </Grid>
        </Grid>
      </form>
      <Grid container spacing={2} alignItems='center' justifyContent='flex-end' marginTop='auto'>
        <Grid item>
          <Button onClick={exportAddresses} color='primary' disabled={Object.entries(derivedWalletKeys).length === 0}>
            Export derive wallet shares
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NCW;
