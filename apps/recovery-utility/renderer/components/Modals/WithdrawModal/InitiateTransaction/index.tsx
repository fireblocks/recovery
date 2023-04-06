import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Autocomplete, TextField as MuiTextField, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import {
  AssetIcon,
  VaultAccount,
  VaultAccountIcon,
  TextField,
  TransactionInitInput,
  transactionInitInput,
  Button,
} from '@fireblocks/recovery-shared';
import { AssetConfig, getAssetConfig } from '@fireblocks/asset-config';
import { useWorkspace } from '../../../../context/Workspace';

type Props = {
  accountsArray: VaultAccount[];
  assetsInAccount: AssetConfig[];
  initialAccountId?: number;
  initialAssetId?: string;
  onSubmit: (data: TransactionInitInput) => void;
};

export const InitiateTransaction = ({ accountsArray, assetsInAccount, initialAccountId, initialAssetId, onSubmit }: Props) => {
  const { accounts } = useWorkspace();

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionInitInput>({
    resolver: zodResolver(transactionInitInput),
    defaultValues: {
      accountId: initialAccountId,
      assetId: initialAssetId,
      to: '',
    },
    // mode: 'onChange',
    // reValidateMode: 'onChange',
  });

  const [assetId, accountId] = watch(['assetId', 'accountId']);

  return (
    <Grid component='form' container spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <Grid item xs={12}>
        <Autocomplete
          id='assetId'
          autoComplete
          // autoSelect
          // blurOnSelect
          // includeInputInList
          value={getAssetConfig(assetId)}
          options={assetsInAccount}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <MuiTextField {...params} fullWidth label='Asset' />}
          renderOption={(props, option, { selected }) => (
            <ListItemButton
              selected={selected}
              dense
              divider
              onClick={() => setValue('assetId', option.id)}
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
          onChange={(_, newAsset) => setValue('assetId', newAsset?.id ?? '')}
        />
      </Grid>
      <Grid item xs={12}>
        <Autocomplete
          id='accountId'
          autoComplete
          // autoSelect
          // blurOnSelect
          // includeInputInList
          value={accounts.get(accountId)}
          options={accountsArray}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => <MuiTextField {...params} fullWidth label='From' />}
          renderOption={(props, option, { selected }) => (
            <ListItemButton
              selected={selected}
              dense
              divider
              onClick={() => setValue('accountId', option.id)}
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
          onChange={(_, newAccount) => setValue('accountId', newAccount?.id ?? 0)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          id='toAddress'
          label='Recipient Address'
          error={errors.to?.message}
          autoComplete='off'
          autoCapitalize='off'
          spellCheck={false}
          isMonospace
          {...register('to')}
        />
      </Grid>
      <Grid item xs={12}>
        <Button type='submit' variant='contained' color='primary' fullWidth>
          Create Transaction
        </Button>
      </Grid>
    </Grid>
  );
};
