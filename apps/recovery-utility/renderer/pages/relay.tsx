import { Box, Typography } from '@mui/material';
import { theme } from '@fireblocks/recovery-shared';
import Link from 'next/link';
import type { NextPageWithLayout } from './_app';
import { useWorkspace } from '../context/Workspace';
import { Layout } from '../components/Layout';
import { QrCode } from '../components/QrCode';

const Relay: NextPageWithLayout = () => {
  const { extendedKeys, getRelayUrl } = useWorkspace();

  const hasExtendedPublicKeys = !!extendedKeys && (extendedKeys.xpub || extendedKeys.fpub);
  const hasExtendedPrivateKeys = !!extendedKeys && (extendedKeys.xprv || extendedKeys.fprv);
  const hasNoExtendedKeys = !hasExtendedPublicKeys && !hasExtendedPrivateKeys;
  const hasOnlyExtendedPublicKeys = hasExtendedPublicKeys && !hasExtendedPrivateKeys;

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
      <Box display='flex' alignItems='flex-start' justifyContent='center'>
        <QrCode
          title='Relay URL'
          data={
            extendedKeys
              ? getRelayUrl('/', {
                  xpub: extendedKeys?.xpub,
                  fpub: extendedKeys?.fpub,
                })
              : undefined
          }
          width={300}
          bgColor={theme.palette.background.paper}
        />
        <Box
          width={298}
          height={298}
          display='flex'
          alignItems='center'
          justifyContent='center'
          color='#FFF'
          sx={{ background: '#000' }}
        >
          QR Scanner
        </Box>
      </Box>
    </Box>
  );
};

Relay.getLayout = (page) => <Layout>{page}</Layout>;

export default Relay;
