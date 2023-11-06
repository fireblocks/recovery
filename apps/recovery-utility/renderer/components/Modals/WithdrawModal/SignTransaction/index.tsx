import { ReactNode, useEffect } from 'react';
import { Typography, Box, Grid, List, ListItem, ListItemIcon, ListItemText, SxProps, Theme } from '@mui/material';
import {
  VaultAccount,
  RelayRxTx,
  RelaySignTxResponseParams,
  Button,
  monospaceFontFamily,
  VaultAccountIcon,
  AssetIcon,
  AssetsIcon,
  getLogger,
  sanatize,
  useWrappedState,
} from '@fireblocks/recovery-shared';
import { AssetConfig } from '@fireblocks/asset-config';
import { CallMade, CallReceived, LeakAdd, Toll } from '@mui/icons-material';
import { useWorkspace } from '../../../../context/Workspace';
import { useSettings } from '../../../../context/Settings';
import { SigningWallet } from '../../../../lib/wallets/SigningWallet';
import { StdUTXO, BaseUTXOType, SegwitUTXOType, BTCSegwitUTXO, BTCLegacyUTXO } from '../../../../lib/wallets/types';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';

const BlockedMessage = ({ children }: { children: ReactNode }) => (
  <Box>
    <Typography color='error' variant='body1'>
      {children} This could be a phishing attempt. Transaction signing blocked.
    </Typography>
  </Box>
);

const textOverflowStyles: SxProps<Theme> = {
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

type Props = {
  txId: string;
  account: VaultAccount;
  asset: AssetConfig;
  inboundRelayParams: RelaySignTxResponseParams;
};

const logger = getLogger(LOGGER_NAME_UTILITY);

export const SignTransaction = ({ txId, account, asset, inboundRelayParams }: Props) => {
  logger.info('Inbound relay params', inboundRelayParams);

  const { unsignedTx } = inboundRelayParams;

  const { extendedKeys, getOutboundRelayUrl } = useWorkspace();

  const { relayBaseUrl } = useSettings();

  const [outboundRelayUrl, setOutboundRelayUrl] = useWrappedState<string | undefined>('outboundRelayUrl', undefined);

  const onApproveTransaction = async () => {
    logger.info(`Trying to approve transaction.`);

    const { xprv, fprv } = extendedKeys || {};

    if (!xprv || !fprv) {
      return;
    }

    const { to, amount, misc } = unsignedTx;

    const derivation = account.wallets.get(asset.id)?.derivations.get(unsignedTx.from);

    if (!derivation) {
      throw new Error('Derivation not found');
    }

    const sanatizedDerivation = sanatize(derivation);
    logger.debug(`About to sign tx to ${to}`, { sanatizedDerivation });

    const utxos = misc
      ? misc?.utxoType === BaseUTXOType
        ? (misc?.utxos as StdUTXO[])
        : misc?.utxoType === SegwitUTXOType
        ? (misc?.utxos as BTCSegwitUTXO[])
        : (misc?.utxos as BTCLegacyUTXO[])
      : undefined;

    const { tx } = await (derivation as SigningWallet).generateTx({
      to,
      amount,
      utxos: utxos, // TODO: Fix type
      feeRate: misc?.feeRate,
      nonce: misc?.nonce,
      gasPrice: misc?.gasPrice,
      memo: misc?.memo,
      // blockHash: misc?.blockHash,
      extraParams: misc?.extraParams,
    });

    logger.info({ tx });

    setOutboundRelayUrl(
      getOutboundRelayUrl({
        action: 'tx/broadcast',
        accountId: account.id,
        signedTx: {
          id: unsignedTx.id,
          assetId: unsignedTx.assetId,
          path: unsignedTx.path,
          from: unsignedTx.from,
          to: unsignedTx.to,
          amount: unsignedTx.amount,
          hex: tx,
        },
        endpoint: misc?.endpoint,
      }),
    );
  };

  if (inboundRelayParams.accountId !== account.id || unsignedTx.path[2] !== account.id) {
    return <BlockedMessage>Unexpected account ID from Recovery Relay.</BlockedMessage>;
  }

  if (unsignedTx.assetId !== asset.id) {
    return <BlockedMessage>Unexpected asset ID from Recovery Relay.</BlockedMessage>;
  }

  if (unsignedTx.id !== txId) {
    return <BlockedMessage>Unexpected transaction ID from Recovery Relay.</BlockedMessage>;
  }

  return (
    <Box display='flex' flexDirection='column' alignItems='center'>
      {outboundRelayUrl ? (
        <RelayRxTx txTitle='Signed transaction' txUrl={outboundRelayUrl} />
      ) : (
        <>
          <Typography variant='body1' color='error' paragraph>
            Carefully confirm all transaction details before signing with your private key.
          </Typography>
          <Grid container spacing={2} padding='1em'>
            <Grid item xs={6}>
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
                  <ListItemText
                    primary='From'
                    secondary={
                      <>
                        <Typography component='span' variant='body1' display='flex' alignItems='center' sx={textOverflowStyles}>
                          <VaultAccountIcon color='primary' fontSize='small' sx={{ marginRight: '0.25em' }} /> {account.name}
                        </Typography>
                        <Typography component='span' variant='body1' fontFamily={monospaceFontFamily} sx={textOverflowStyles}>
                          {unsignedTx.from}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ fontWeight: '600', color: '#000' }}
                    secondaryTypographyProps={{ sx: textOverflowStyles }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: '42px' }}>
                    <CallReceived />
                  </ListItemIcon>
                  <ListItemText
                    primary='To'
                    secondary={unsignedTx.to}
                    primaryTypographyProps={{ fontWeight: '600', color: '#000' }}
                    secondaryTypographyProps={{ fontFamily: monospaceFontFamily, sx: textOverflowStyles }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: '42px' }}>
                    <Toll />
                  </ListItemIcon>
                  <ListItemText
                    primary='Amount'
                    secondary={unsignedTx.amount}
                    primaryTypographyProps={{ fontWeight: '600', color: '#000' }}
                    secondaryTypographyProps={{ fontFamily: monospaceFontFamily, sx: textOverflowStyles }}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={6}>
              <List aria-label='Recovery Relay Instance'>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: '42px' }}>
                    <LeakAdd />
                  </ListItemIcon>
                  <ListItemText primary='Recovery Relay Instance' primaryTypographyProps={{ fontWeight: '600', color: '#000' }} />
                </ListItem>
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
              </List>
            </Grid>
          </Grid>
          <Button onClick={onApproveTransaction}>Approve & Sign Transaction</Button>
        </>
      )}
    </Box>
  );
};
