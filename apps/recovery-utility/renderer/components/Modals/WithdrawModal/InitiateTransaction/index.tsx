import { useMemo } from 'react';
import { Typography, Box, Grid, Autocomplete, TextField, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { AssetIcon, VaultAccount, VaultAccountIcon, RelayRxTx } from '@fireblocks/recovery-shared';
import { AssetConfig } from '@fireblocks/asset-config';
import { useWorkspace } from '../../../../context/Workspace';

type Props = {
  txId: string;
  accountsArray: VaultAccount[];
  assetsInAccount: AssetConfig[];
  account?: VaultAccount;
  asset?: AssetConfig;
  onChangeAccount: (newAccount?: VaultAccount) => void;
  onChangeAssetId: (newAssetId?: string) => void;
};

export const InitiateTransaction = ({
  txId,
  accountsArray,
  assetsInAccount,
  account,
  asset,
  onChangeAccount,
  onChangeAssetId,
}: Props) => {
  const { extendedKeys, getOutboundRelayUrl, setInboundRelayUrl } = useWorkspace();

  let txTitle = 'Extended public keys';

  if (typeof account?.id === 'number') {
    txTitle += ` / account ${account.id}`;
  }

  if (typeof asset?.id === 'string') {
    txTitle += ` / asset ${asset.id}`;
  }

  const outboundRelayUrl = useMemo(() => {
    const { xpub, fpub } = extendedKeys || {};

    if (!xpub || !fpub || !txId || typeof account?.id !== 'number' || !asset?.id) {
      return undefined;
    }

    return getOutboundRelayUrl({
      action: 'tx/create',
      accountId: account.id,
      newTx: {
        id: txId,
        assetId: asset.id,
      },
    });
  }, [extendedKeys, txId, account, asset, getOutboundRelayUrl]);

  return (
    <>
      <Typography variant='body1' paragraph>
        Scan the QR code with an online device to create a transaction with Recovery Relay. Pass QR codes back and forth to sign
        the transaction with Recovery Utility and broadcast it with Recovery Relay. This does not expose your private keys.
      </Typography>
      <Grid container spacing={2} marginBottom='1em'>
        <Grid item xs={6}>
          <Autocomplete
            id='assetId'
            autoComplete
            // autoSelect
            // blurOnSelect
            // includeInputInList
            value={(asset ?? { id: '' }) as AssetConfig}
            options={assetsInAccount}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} fullWidth label='Asset' />}
            renderOption={(props, option, { selected }) => (
              <ListItemButton
                selected={selected}
                dense
                divider
                onClick={() => onChangeAssetId(option.id)}
                sx={{ transition: 'none' }}
              >
                <ListItemIcon>
                  <Box
                    width={40}
                    height={40}
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    borderRadius={40}
                    border={(_theme) => `solid 1px ${_theme.palette.grey[300]}`}
                    sx={{ background: '#FFF' }}
                  >
                    <AssetIcon assetId={option.id} />
                  </Box>
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: 'h2' }} primary={option.name} secondary={option.id} />
              </ListItemButton>
            )}
            onChange={(_, newAsset) => onChangeAssetId(newAsset?.id)}
          />
        </Grid>
        <Grid item xs={6}>
          <Autocomplete
            id='accountId'
            autoComplete
            // autoSelect
            // blurOnSelect
            // includeInputInList
            value={(account ?? { name: '' }) as VaultAccount}
            options={accountsArray}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} fullWidth label='From' />}
            renderOption={(props, option, { selected }) => (
              <ListItemButton
                selected={selected}
                dense
                divider
                onClick={() => onChangeAccount(option)}
                sx={{ transition: 'none' }}
              >
                <ListItemIcon>
                  <Box
                    width={40}
                    height={40}
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    borderRadius={40}
                    border={(_theme) => `solid 1px ${_theme.palette.grey[300]}`}
                    sx={{ background: '#FFF' }}
                  >
                    <VaultAccountIcon color='primary' />
                  </Box>
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: 'h2' }} primary={option.name} secondary={`ID ${option.id}`} />
              </ListItemButton>
            )}
            onChange={(_, newAccount) => onChangeAccount(newAccount ?? undefined)}
          />
        </Grid>
      </Grid>
      <RelayRxTx
        rxTitle='Transaction parameters'
        txTitle={txTitle}
        txUrl={outboundRelayUrl}
        onDecodeQrCode={setInboundRelayUrl}
      />
    </>
  );
};
