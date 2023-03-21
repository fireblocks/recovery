import { Typography } from '@mui/material';
import { RelayBasePage, RelayRequestParams } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../context/Workspace';

const getRxTitle = (params?: RelayRequestParams) => {
  switch (params?.action) {
    case 'import':
      return 'Extended public keys & wallet';
    case 'tx/create':
      return 'New transaction request';
    case 'tx/broadcast':
      return 'Signed transaction';
    default:
      return undefined;
  }
};

const Relay = () => {
  const { extendedKeys: { xpub, fpub } = {}, inboundRelayParams, setInboundRelayUrl } = useWorkspace();

  const hasExtendedPublicKeys = !!xpub || !!fpub;

  const rxTitle = getRxTitle(inboundRelayParams);

  return (
    <RelayBasePage rxTitle={rxTitle} onDecodeQrCode={setInboundRelayUrl}>
      <Typography variant='body1' paragraph>
        Scan QR codes from Recovery Utility to import extended public keys, wallets, and signed transactions. This does not send
        your private keys.
      </Typography>
      {!hasExtendedPublicKeys && (
        <Typography variant='body1' paragraph color='error'>
          No extended public keys found. Scan a Relay QR code from Recovery Utility to import extended public keys.
        </Typography>
      )}
    </RelayBasePage>
  );
};

export default Relay;
