import React, { useId, useState } from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { assetsArray } from '@fireblocks/asset-config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VaultAccount } from '../../../types';
import { BaseModal } from '../../BaseModal';
import { Button } from '../../Button';
import { AssetIcon } from '../../Icons';
import { TextField } from '../../TextField';

const searchSchema = z.object({
  assetIdSearch: z.string().nonempty('Asset ID is required'),
});

type Input = z.infer<typeof searchSchema>;

type Props = {
  assetsNotInAccount?: { id: string; name: string }[];
  account?: VaultAccount;
  open: boolean;
  onClose: VoidFunction;
  addWallet: (assetId: string, accountId: number) => void;
};

export const RecoverWalletModal = ({ assetsNotInAccount = assetsArray, account, open, onClose: _onClose, addWallet }: Props) => {
  const searchId = useId();

  const [assetId, setAssetId] = useState<string | null>(null);

  const { watch, register, reset, handleSubmit } = useForm<Input>({
    defaultValues: { assetIdSearch: '' },
    resolver: zodResolver(searchSchema),
  });

  const onSubmitSearch = (data: Input) => setAssetId(data.assetIdSearch);

  const assetIdSearch = watch('assetIdSearch');
  const assetIdSearchNormalized = assetIdSearch.toLowerCase();

  const filteredAssets = assetsNotInAccount
    .filter(
      ({ id, name }) =>
        id.toLowerCase().includes(assetIdSearchNormalized) || name.toLowerCase().includes(assetIdSearchNormalized),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  const onClose = () => {
    _onClose();

    setAssetId(null);

    reset();
  };

  const onClickAsset = (_assetId: string) => setAssetId(_assetId);

  const onClickRecover = () => {
    if (typeof account?.id === 'number' && assetId) {
      addWallet(assetId, account.id);
    }

    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={
        (
          <Box>
            {!!account?.name && (
              <Typography component='h2' variant='h3' marginTop='1em' color={(theme) => theme.palette.text.disabled}>
                {account.name}
              </Typography>
            )}
            <Typography variant='h1' marginTop='0.5em'>
              Recover Asset Wallet
            </Typography>
          </Box>
        ) as unknown as string
      }
      actions={
        <>
          <Button variant='text' onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!assetId} onClick={onClickRecover}>
            Recover
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmitSearch)}>
        <TextField
          id={searchId}
          aria-label='Search assets'
          placeholder='Search assets'
          autoFocus
          {...register('assetIdSearch')}
        />
        <List component='nav' aria-label='main mailbox folders'>
          {filteredAssets.length ? (
            filteredAssets.map((asset) => (
              <ListItemButton
                key={asset.id}
                selected={assetId === asset.id}
                dense
                divider
                onClick={() => onClickAsset(asset.id)}
                sx={{
                  transition: 'none',
                  '&:hover': {
                    background: 'transparent',
                    boxShadow: '0px 3px 10px 0 rgb(41 51 155 / 15%)',
                    borderRadius: '8px',
                  },
                }}
              >
                <ListItemIcon>
                  <Box
                    width={40}
                    height={40}
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    borderRadius={40}
                    border={(theme) => `solid 1px ${theme.palette.grey[300]}`}
                    sx={{ background: '#FFF' }}
                  >
                    <AssetIcon assetId={asset.id} />
                  </Box>
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: 'h2' }} primary={asset.id} secondary={asset.name} />
              </ListItemButton>
            ))
          ) : (
            <Typography variant='body1' color={(theme) => theme.palette.text.disabled} textAlign='center'>
              No asset found for &quot;{assetIdSearch}&quot;
            </Typography>
          )}
        </List>
      </form>
    </BaseModal>
  );
};
