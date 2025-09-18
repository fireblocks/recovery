import React from 'react';
import { useRouter } from 'next/router';
import { Box, Grid, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAssetConfig } from '@fireblocks/asset-config';
import { download } from '../lib/download';
import { csvExport } from '../lib/csv';
import { importCsvInput, ImportCsvInput, addressesCsv as addressesCsvSchema, AddressesCsv, KeysetKeys } from '../schemas';
import { VaultAccount } from '../types';
import { Button, UploadWell } from '../components';
import { useWrappedState } from '../lib/debugUtils';
import { useOfflineMutation } from '../hooks/useOfflineMutation';

type Props = {
  extendedKeys?: KeysetKeys;
  accounts: Map<number, VaultAccount>;
  importCsv: (addressesCsv?: File, balancesCsv?: File) => Promise<void>;
};

export const ImportExportBasePage = ({ extendedKeys, accounts, importCsv }: Props) => {
  const router = useRouter();

  const hasPrivateKey = !!extendedKeys?.xprv || !!extendedKeys?.fprv;

  const [shouldExportKeys, setShouldExportKeys] = useWrappedState<boolean>('csv-shouldExportKeys', false);
  const [importError, setImportError] = useWrappedState<string | undefined>('csv-importError', undefined);
  const [exportError, setExportError] = useWrappedState<string | undefined>('csv-exportError', undefined);

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ImportCsvInput>({
    resolver: zodResolver(importCsvInput),
  });

  const [addressesCsv, balancesCsv] = watch(['addressesCsv', 'balancesCsv']);

  const onDropCsv = async (file: File, key: keyof ImportCsvInput) => {
    try {
      setValue(key, file);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : (error as string));

      setValue(key, undefined);
    }
  };

  const onDropAddressesCsv = async (file: File) => onDropCsv(file, 'addressesCsv');
  // const onDropBalancesCsv = async (file: File) => onDropCsv(file, 'balancesCsv');

  const importMutation = useOfflineMutation({
    mutationFn: (formData: ImportCsvInput) => importCsv(formData.addressesCsv, formData.balancesCsv),
    onSuccess: () => router.push('/accounts/vault'),
    onError: (error: Error) => setImportError(error instanceof Error ? error.message : (error as string)),
  });

  const onSubmitImport = (formData: ImportCsvInput) => importMutation.mutate(formData);

  const handleChangeShouldExportKeys = (checked: boolean) => setShouldExportKeys(checked);

  const exportCsv = (exportKeys = false) => {
    const data = Array.from(accounts).reduce((acc, [accountId, account]) => {
      const rows = Array.from(account.wallets).reduce((_rows, [assetId, wallet]) => {
        const walletRows = Array.from(wallet.derivations).map(([, derivation]) => ({
          accountName: account.name,
          accountId,
          assetId,
          assetName: getAssetConfig(assetId)?.name ?? assetId,
          address: derivation.address,
          addressType: derivation.type,
          addressDescription: derivation.description,
          tag: derivation.tag,
          pathParts: derivation.pathParts,
          publicKey: exportKeys ? derivation.publicKey : undefined,
          privateKey: exportKeys && hasPrivateKey ? derivation.privateKey : undefined,
          privateKeyWif: exportKeys && hasPrivateKey ? derivation.wif : undefined,
        }));

        return [..._rows, ...walletRows];
      }, [] as AddressesCsv[]);

      return [...acc, ...rows];
    }, [] as AddressesCsv[]);

    const csv = csvExport(data, addressesCsvSchema);

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9T-]/g, '')
      .slice(0, -3);

    const filename = `Fireblocks_vault_addresses_${exportKeys ? 'keys_' : ''}recovery_${timestamp}.csv`;

    return { csv, filename };
  };

  const exportMutation = useOfflineMutation({
    mutationFn: async () => exportCsv(shouldExportKeys),
    onSuccess: ({ csv, filename }) => download(csv, filename, 'text/plain'),
    onError: (error: Error) => setExportError(error instanceof Error ? error.message : (error as string)),
  });

  return (
    <Box height='100%' display='flex' flexDirection='column'>
      <Typography variant='h1'>Import / Export Vault Data</Typography>
      <form onSubmit={handleSubmit(onSubmitImport, console.error)}>
        <Typography variant='h2'>Import</Typography>
        <Typography variant='body1' paragraph>
          Import Vault addresses previously exported from the Fireblocks Console or Recovery Utility.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <UploadWell
              label='Address Data'
              error={errors.addressesCsv?.message}
              hasFile={!!addressesCsv}
              accept={{ 'text/csv': ['.csv'] }}
              disabled={importMutation.isLoading}
              onDrop={onDropAddressesCsv}
            />
          </Grid>
          {/* <Grid item xs={6}>
            <UploadWell
              label='Balance Data'
              error={errors.balancesCsv?.message}
              hasFile={!!balancesCsv}
              accept={{ 'text/csv': ['.csv'] }}
              disabled={importMutation.isLoading}
              onDrop={onDropBalancesCsv}
            />
          </Grid> */}
        </Grid>
        <Grid container spacing={2} alignItems='center'>
          <Grid item flex='1'>
            <Typography variant='body1' fontWeight='600' color={(theme) => theme.palette.error.main}>
              {importError}
            </Typography>
          </Grid>
          <Grid item>
            <Button type='submit' color='primary' disabled={importMutation.isLoading || (!addressesCsv && !balancesCsv)}>
              Import
            </Button>
          </Grid>
        </Grid>
      </form>
      <Typography variant='h2'>Export</Typography>
      <Typography variant='body1' paragraph>
        Export derived Vault addresses to a CSV file.
      </Typography>
      {hasPrivateKey && (
        <FormGroup>
          <FormControlLabel
            label={`Include ${hasPrivateKey ? 'private' : 'public'} keys`}
            control={<Checkbox defaultChecked />}
            checked={shouldExportKeys}
            onChange={(_, checked) => handleChangeShouldExportKeys(checked)}
            disabled={exportMutation.isLoading}
          />
        </FormGroup>
      )}
      <Grid container spacing={2} alignItems='center'>
        <Grid item flex='1'>
          <Typography variant='body1' fontWeight='600' color={(theme) => theme.palette.error.main}>
            {exportError}
          </Typography>
        </Grid>
        <Grid item>
          <Button color='primary' disabled={exportMutation.isLoading} onClick={() => exportMutation.mutate()}>
            Export
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
