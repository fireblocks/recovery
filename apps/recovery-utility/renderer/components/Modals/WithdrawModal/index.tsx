import { useMemo, useState } from 'react';
import { Typography, Box, Grid, Autocomplete, TextField, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { AssetIcon, theme, getRelayUrl, VaultAccount, BaseModal, QrCode } from '@fireblocks/recovery-shared';
import { getAssetConfig, derivableAssets, AssetConfig } from '@fireblocks/asset-config';
import { useSettings } from '../../../context/Settings';
import { useWorkspace } from '../../../context/Workspace';
import { VaultAccountIcon } from '../../Icons';

type Props = {
  assetId?: string;
  accountId?: number;
  open: boolean;
  onClose: VoidFunction;
};

export const WithdrawModal = ({ assetId: openAssetId, accountId, open, onClose }: Props) => {
  const { relayBaseUrl } = useSettings();

  const { extendedKeys, asset: defaultAsset, accounts } = useWorkspace();

  const accountsArray = useMemo(() => Array.from(accounts.values()), [accounts]);

  const assetsInVault = useMemo(
    () => derivableAssets.filter((asset) => accountsArray.some((account) => account.wallets.has(asset.id))),
    [accountsArray],
  );

  const [account, setAccount] = useState<VaultAccount | undefined>(() =>
    typeof accountId === 'number' ? accounts.get(accountId) : undefined,
  );

  const onChangeAccount = (newAccount: VaultAccount | null) => setAccount(newAccount ?? undefined);

  const resolvedAssetId = openAssetId ?? defaultAsset?.id;

  const [resolvedAsset, setAsset] = useState<AssetConfig | undefined>(getAssetConfig(resolvedAssetId));

  const onChangeAsset = (newAsset: AssetConfig | null) => setAsset(newAsset ?? undefined);

  const relayUrl = useMemo(() => {
    if (!resolvedAsset?.id || !extendedKeys) {
      return '';
    }

    const { xpub, fpub } = extendedKeys;

    return getRelayUrl('/', { xpub, fpub, assetId: resolvedAsset.id, accountId }, relayBaseUrl);
  }, [resolvedAsset, extendedKeys, accountId, relayBaseUrl]);

  return (
    <BaseModal open={open} onClose={onClose} title='New Withdrawal'>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                id='assetId'
                autoComplete
                // autoSelect
                // blurOnSelect
                // includeInputInList
                value={(resolvedAsset ?? { id: '' }) as AssetConfig}
                options={assetsInVault as unknown as AssetConfig[]}
                getOptionLabel={(option) => option.id}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} fullWidth label='Asset' />}
                renderOption={(props, option, { selected }) => (
                  <ListItemButton
                    selected={selected}
                    dense
                    divider
                    onClick={() => onChangeAsset(option)}
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
                    <ListItemText primaryTypographyProps={{ variant: 'h2' }} primary={option.id} secondary={option.name} />
                  </ListItemButton>
                )}
                onChange={(_, newAsset) => onChangeAsset(newAsset)}
                sx={{ width: 300 }}
              />
            </Grid>
            <Grid item xs={12}>
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
                    <ListItemText primaryTypographyProps={{ variant: 'h2' }} primary={option.id} secondary={option.name} />
                  </ListItemButton>
                )}
                onChange={(_, newAccount) => onChangeAccount(newAccount)}
                sx={{ width: 300 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body1' paragraph>
                Scan the QR code with an online device to send a transaction with Fireblocks Recovery Relay. Use the PIN to
                decrypt the {resolvedAsset?.name} private key.
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <QrCode data={relayUrl} title='Open with an online device' bgColor={theme.palette.background.default} />
          </Box>
        </Grid>
      </Grid>
    </BaseModal>
  );
};
