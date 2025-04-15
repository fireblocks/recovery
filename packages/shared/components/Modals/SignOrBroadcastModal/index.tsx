/* eslint-disable import/no-duplicates */
/* eslint-disable no-nested-ternary */
import React from 'react';
import { Typography, Box, Grid, List, ListItem, ListItemIcon, ListItemText, SxProps, Theme, Tooltip } from '@mui/material';
import { AssetConfig } from '@fireblocks/asset-config';
import { CallMade, CallReceived, LeakAdd, Toll } from '@mui/icons-material';
import { LOGGER_NAME_SHARED } from '@fireblocks/recovery-shared/constants';
import { getLogger } from '../../../lib/getLogger';
import { RelaySignTxResponseParams, RelayBroadcastTxRequestParams } from '../../../schemas';
import { monospaceFontFamily } from '../../../theme';
import { VaultAccount } from '../../../types';
import { AssetsIcon, AssetIcon, VaultAccountIcon } from '../../Icons';
import { Button } from '../../Button';

const textOverflowStyles: SxProps<Theme> = {
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

type Props<App extends 'utility' | 'relay'> = {
  broadcastHidden?: App extends 'utility' ? undefined : boolean;
  account: VaultAccount;
  asset: AssetConfig;
  onApproveTransaction?: App extends 'utility' ? () => Promise<void> : undefined;
  broadcastTransaction?: App extends 'utility' ? undefined : () => Promise<void>;
  inboundRelayParams: App extends 'utility' ? RelaySignTxResponseParams : RelayBroadcastTxRequestParams;
};

const logger = getLogger(LOGGER_NAME_SHARED);

export const SignOrBroadcastTransaction = <App extends 'utility' | 'relay'>({
  account,
  asset,
  onApproveTransaction,
  broadcastTransaction,
  broadcastHidden,
  inboundRelayParams,
}: Props<App>) => {
  logger.info('Inbound relay params', inboundRelayParams);

  const runningOnUtility = 'unsignedTx' in inboundRelayParams;

  const inboundTx = runningOnUtility ? inboundRelayParams.unsignedTx : inboundRelayParams.signedTx;

  return (
    <Box display='flex' flexDirection='column' alignItems='center'>
      <Typography variant='body1' color='error' paragraph>
        Carefully confirm all transaction details before{' '}
        {runningOnUtility ? 'signing with your private key.' : 'broadcasting this transaction'}
      </Typography>
      <Grid container spacing={runningOnUtility ? 2 : 1} padding='1em'>
        <Grid item xs={runningOnUtility ? 6 : 12}>
          <List aria-label='Transaction parameters'>
            <ListItem disablePadding>
              <ListItemIcon sx={{ minWidth: '42px' }}>
                <AssetsIcon />
              </ListItemIcon>
              <ListItemText
                primary='Asset'
                secondary={
                  <>
                    <AssetIcon assetId={asset.id} fontSize='small' sx={{ marginRight: '0.25em' }} /> {asset.name}
                  </>
                }
                primaryTypographyProps={{ fontWeight: '600', color: '#000' }}
                secondaryTypographyProps={{ display: 'flex', alignItems: 'center', sx: textOverflowStyles }}
              />
            </ListItem>
            <ListItem disablePadding>
              <ListItemIcon sx={{ minWidth: '42px' }}>
                <CallMade />
              </ListItemIcon>
              <Tooltip title={inboundTx.from}>
                <ListItemText
                  primary='From'
                  secondary={
                    <>
                      <Typography component='span' variant='body1' display='flex' alignItems='center' sx={textOverflowStyles}>
                        <VaultAccountIcon color='primary' fontSize='small' sx={{ marginRight: '0.25em' }} /> {account.name}
                      </Typography>
                      <Typography component='span' variant='body1' fontFamily={monospaceFontFamily} sx={textOverflowStyles}>
                        {inboundTx.from}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{ fontWeight: '600', color: '#000' }}
                  secondaryTypographyProps={{ sx: textOverflowStyles }}
                />
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <ListItemIcon sx={{ minWidth: '42px' }}>
                <CallReceived />
              </ListItemIcon>
              <Tooltip title={inboundTx.to}>
                <ListItemText
                  primary='To'
                  secondary={inboundTx.to}
                  primaryTypographyProps={{ fontWeight: '600', color: '#000' }}
                  secondaryTypographyProps={{ fontFamily: monospaceFontFamily, sx: textOverflowStyles }}
                />
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <ListItemIcon sx={{ minWidth: '42px' }}>
                <Toll />
              </ListItemIcon>
              <ListItemText
                primary='Amount'
                secondary={inboundTx.amount}
                primaryTypographyProps={{ fontWeight: '600', color: '#000' }}
                secondaryTypographyProps={{ fontFamily: monospaceFontFamily, sx: textOverflowStyles }}
              />
            </ListItem>
          </List>
        </Grid>
        {runningOnUtility && (
          <Grid item xs={6}>
            <List aria-label='Recovery Relay Instance'>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: '42px' }}>
                  <LeakAdd />
                </ListItemIcon>
                <ListItemText primary='Recovery Relay Instance' primaryTypographyProps={{ fontWeight: '600', color: '#000' }} />
              </ListItem>
              <>
                <ListItem disablePadding>
                  <ListItemText
                    primary='IP'
                    secondary={inboundRelayParams.ip || 'Unknown'}
                    primaryTypographyProps={{ fontWeight: '500' }}
                    secondaryTypographyProps={{ fontFamily: monospaceFontFamily, sx: textOverflowStyles }}
                    sx={{ paddingLeft: '42px' }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary='Version'
                    secondary={inboundRelayParams.version}
                    primaryTypographyProps={{ fontWeight: '500' }}
                    secondaryTypographyProps={{ fontFamily: monospaceFontFamily, sx: textOverflowStyles }}
                    sx={{ paddingLeft: '42px' }}
                  />
                </ListItem>
              </>
            </List>
          </Grid>
        )}
      </Grid>

      {runningOnUtility && <Button onClick={onApproveTransaction}>Approve & Sign Transaction</Button>}
      {!runningOnUtility && (
        <Button sx={{ display: broadcastHidden ? 'none' : undefined }} onClick={broadcastTransaction}>
          Broadcast Transaction
        </Button>
      )}
    </Box>
  );
};
