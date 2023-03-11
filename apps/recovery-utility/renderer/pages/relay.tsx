import { Box, Grid, lighten, Typography } from '@mui/material';
import { AllRelayParams, RelayPath, QrCode, QrCodeScanner, ScanResult, theme } from '@fireblocks/recovery-shared';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { getAssetConfig } from '@fireblocks/asset-config';
import type { NextPageWithLayout } from './_app';
import { useSettings } from '../context/Settings';
import { useWorkspace } from '../context/Workspace';
import { Layout } from '../components/Layout';

const Relay: NextPageWithLayout = () => {
  const { relayBaseUrl } = useSettings();

  const { extendedKeys: { xpub, fpub, xprv, fprv } = {}, accounts, getRelayUrl, setWorkspaceFromRelayUrl } = useWorkspace();

  const hasExtendedPublicKeys = !!xpub || !!fpub;
  const hasExtendedPrivateKeys = !!xprv || !!fprv;
  const hasNoExtendedKeys = !hasExtendedPublicKeys && !hasExtendedPrivateKeys;
  const hasOnlyExtendedPublicKeys = hasExtendedPublicKeys && !hasExtendedPrivateKeys;

  const [txRelayPath, setTxRelayPath] = useState<Exclude<RelayPath, '/balances' | '/sign'>>('/');
  const [txRelayParams, setTxRelayParams] = useState<AllRelayParams | undefined>(
    hasExtendedPublicKeys ? { xpub, fpub } : undefined,
  );
  const [rxRelayParams, setRxRelayParams] = useState<AllRelayParams | undefined>();

  const onDecodeQrCode = ({ data }: ScanResult) => {
    console.info('Scan result:', data);

    const relay = setWorkspaceFromRelayUrl(data);

    if (relay) {
      const { path, params } = relay;

      setRxRelayParams(params);

      switch (path) {
        case '/balances':
          console.info('Updating wallets');
          break;
        case '/sign':
          console.info('Prompting for transaction signature');
          break;
        default:
          console.info('Unknown Relay path');
      }
    }
  };

  const relayUrl = txRelayParams ? getRelayUrl(txRelayPath, txRelayParams) : relayBaseUrl;

  let txTitle: string | undefined;
  let rxTitle: string | undefined;

  if (txRelayParams?.signature) {
    txTitle = 'Signed transaction';
  } else if (hasExtendedPublicKeys) {
    txTitle = 'Extended public keys';
  }

  if (rxRelayParams?.txHex) {
    rxTitle = `Unsigned transaction${hasOnlyExtendedPublicKeys ? ' (read-only)' : ''}`;
  } else if (hasExtendedPublicKeys) {
    rxTitle = 'Wallet balances';

    const singleBalance = rxRelayParams?.balances?.length === 1 ? rxRelayParams.balances[0] : undefined;
    const accountLabel =
      (typeof singleBalance?.accountId !== 'undefined'
        ? accounts.get(singleBalance.accountId)?.name
        : singleBalance?.accountId) ?? singleBalance?.accountId;
    const assetLabel = getAssetConfig(singleBalance?.assetId)?.name ?? singleBalance?.assetId;
    const hasAccountLabel = typeof accountLabel !== 'undefined';
    const hasAssetLabel = typeof assetLabel !== 'undefined';

    rxTitle += hasAccountLabel || hasAssetLabel ? ' for ' : '';
    rxTitle += hasAccountLabel ? `account ${accountLabel}` : '';
    rxTitle += hasAccountLabel && hasAssetLabel ? ' / ' : '';
    rxTitle += hasAssetLabel ? `asset ${assetLabel}` : '';
  }

  const showStatus = !!txTitle || !!rxTitle;

  return (
    <Box>
      <Typography variant='h1'>Recovery Relay</Typography>
      <Typography variant='body1' paragraph>
        Scan the QR code with your mobile device to fetch wallet balances and securely create transactions. Use this tab to scan
        QR code responses from Recovery Relay to sign transactions and import wallet data. This does not send your private keys.
      </Typography>
      {hasNoExtendedKeys && (
        <Typography variant='body1' paragraph color='error'>
          No extended keys found. <Link href='/verify'>Verify</Link>, <Link href='/recover'>recover</Link>, or{' '}
          <Link href='/keys'>set</Link> your extended keys.
        </Typography>
      )}
      {hasOnlyExtendedPublicKeys && (
        <Typography variant='body1' paragraph color='error'>
          You are only verifying public keys and cannot sign transactions.
        </Typography>
      )}
      {showStatus && (
        <Box
          sx={(t) => ({
            color: t.palette.primary.main,
            border: `solid 1px ${t.palette.primary.main}`,
            background: lighten(t.palette.primary.main, 0.95),
            borderRadius: '0.5rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1em',
          })}
        >
          <Grid container>
            {txTitle && (
              <Grid item xs={6}>
                <Typography variant='caption' fontWeight={500} color='inherit' display='flex' alignItems='center'>
                  <ArrowUpward fontSize='small' sx={{ marginRight: '0.25rem' }} /> Sending
                </Typography>
                <Typography variant='body1' color='inherit'>
                  {txTitle}
                </Typography>
              </Grid>
            )}
            {rxTitle && (
              <Grid item xs={6}>
                <Typography variant='caption' fontWeight={500} color='inherit' display='flex' alignItems='center'>
                  <ArrowDownward fontSize='small' sx={{ marginRight: '0.25rem' }} /> Receiving
                </Typography>
                <Typography variant='body1' color='inherit'>
                  {rxTitle}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
      <Box display='flex' alignItems='flex-start' justifyContent='center'>
        <QrCode title='Relay URL' data={relayUrl} bgColor={theme.palette.background.paper} />
        <QrCodeScanner onDecode={onDecodeQrCode} />
      </Box>
    </Box>
  );
};

Relay.getLayout = (page) => <Layout>{page}</Layout>;

export default Relay;
