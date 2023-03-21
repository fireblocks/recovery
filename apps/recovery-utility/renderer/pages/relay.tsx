import { Typography } from '@mui/material';
import { AllRelayParams, RelayPath, Link, RelayBasePage } from '@fireblocks/recovery-shared';
import { useState } from 'react';
import { getAssetConfig } from '@fireblocks/asset-config';
import { useSettings } from '../context/Settings';
import { useWorkspace } from '../context/Workspace';

const Relay = () => {
  const { relayBaseUrl } = useSettings();

  const { extendedKeys: { xpub, fpub, xprv, fprv } = {}, accounts, getRelayUrl, setWorkspaceFromRelayUrl } = useWorkspace();

  const hasExtendedPublicKeys = !!xpub || !!fpub;
  const hasExtendedPrivateKeys = !!xprv || !!fprv;
  const hasNoExtendedKeys = !hasExtendedPublicKeys && !hasExtendedPrivateKeys;
  const hasOnlyExtendedPublicKeys = hasExtendedPublicKeys && !hasExtendedPrivateKeys;

  const [txRelayPath /* setTxRelayPath */] = useState<Exclude<RelayPath, '/balances' | '/sign'>>('/');
  const [txRelayParams /* setTxRelayParams */] = useState<AllRelayParams | undefined>(
    hasExtendedPublicKeys ? { xpub, fpub } : undefined,
  );
  const [rxRelayParams, setRxRelayParams] = useState<AllRelayParams | undefined>();

  const onDecodeQrCode = (rxUrl: string) => {
    console.info('Scan result:', rxUrl);

    const relay = setWorkspaceFromRelayUrl(rxUrl);

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

  return (
    <RelayBasePage rxTitle={rxTitle} txTitle={txTitle} txUrl={relayUrl} onDecodeQrCode={onDecodeQrCode}>
      <Typography variant='body1' paragraph>
        Scan the QR code with your mobile device to fetch wallet balances and securely send transactions. Use this tab to scan QR
        code responses from Recovery Relay to sign transactions and update wallet balances. This does not send your private keys.
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
    </RelayBasePage>
  );
};

export default Relay;
