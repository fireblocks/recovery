import { ReactNode, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Typography, Box, Grid, CircularProgress, lighten } from '@mui/material';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';
import {
  BaseModal,
  getLogger,
  QrCodeScanner,
  getRelayParams,
  QrCode,
  RelayRawSignTxResponseParams,
} from '@fireblocks/recovery-shared';
import { SigningAlgorithms } from '@fireblocks/recovery-shared/reducers/rawSignReducer';
import SignedMessage from '@fireblocks/recovery-shared/components/RawSigningForm/SignedMessage';
import { CallMade, CallReceived } from '@mui/icons-material';

type RawSigningModalProps = {
  open: boolean;
  qrData: string;
  onClose: VoidFunction;
};

const logger = getLogger(LOGGER_NAME_RELAY);

const RawSigningModal: React.FC<RawSigningModalProps> = (props) => {
  const { open, qrData, onClose: onCloseModal } = props;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [signingAlgorithm, setSigningAlgorithm] = useState<SigningAlgorithms | null>(null);

  const onDecode = async (data: QrScanner.ScanResult) => {
    try {
      setIsProcessing(true);
      const decodedData = data.data;
      const parsed = getRelayParams('utility', decodedData) as RelayRawSignTxResponseParams;
      console.log('Parsed data:', parsed.signedMessage);
      const parsedMessage = parsed.signedMessage;
      setSignedMessage(parsedMessage);
      const parsedAlgorithm = parsed.algorithm as SigningAlgorithms;
      setSigningAlgorithm(parsedAlgorithm);
      setTimeout(() => {
        setIsProcessing(false);
      }, 1250);
    } catch (error) {
      console.error('Error processing QR code:', error);
      setIsProcessing(false);
    }
  };

  const onClose = () => {
    logger.info(`Closing raw-signing modal`);
    onCloseModal();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={
        (
          <Typography variant='h1' display='flex' alignItems='center'>
            <Box display='flex' alignItems='center' marginRight='0.5rem'>
              Raw Signing
            </Box>
          </Typography>
        ) as ReactNode
      }
    >
      {!signedMessage || !signingAlgorithm ? (
        <>
          <Box
            sx={(t) => ({
              color: t.palette.primary.main,
              border: `solid 1px ${t.palette.primary.main}`,
              background: lighten(t.palette.primary.main, 0.95),
              width: '100%',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1em',
            })}
          >
            <Grid container>
              <Grid item xs={6}>
                <Typography variant='caption' fontWeight={500} color='inherit' display='flex' alignItems='center'>
                  <CallMade fontSize='small' sx={{ marginRight: '0.25rem' }} /> Sending
                </Typography>
                <Typography variant='body1' color='inherit'>
                  Message, derivation path, algorithm
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant='caption' fontWeight={500} color='inherit' display='flex' alignItems='center'>
                  <CallReceived fontSize='small' sx={{ marginRight: '0.25rem' }} /> Receiving
                </Typography>
                <Typography variant='body1' color='inherit'>
                  Signed message
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Typography variant='body1' paragraph>
            Scan the QR code using the Recovery Utility to sign a message. Then, scan the QR code produced by the Recovery Utility
            to obtain the signed message.
          </Typography>
          <Grid container spacing={1} alignItems='flex-start' justifyContent='center'>
            <Grid item xs={6}>
              <QrCode title='Relay URL' data={qrData} />
            </Grid>
            <Grid item xs={6}>
              <QrCodeScanner onDecode={onDecode} />
            </Grid>
          </Grid>
        </>
      ) : isProcessing ? (
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexGrow: 1,
            height: '25rem',
          }}
        >
          <CircularProgress size={60} />
        </Grid>
      ) : (
        /* <QrCode showRawData={false} title='Signed Message' data={signedMessage} height='25rem' /> */
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            flexGrow: 1,
          }}
        >
          <SignedMessage selectedAlgorithm={signingAlgorithm} signedMessage={signedMessage} />
        </Grid>
      )}
    </BaseModal>
  );
};

export default RawSigningModal;
