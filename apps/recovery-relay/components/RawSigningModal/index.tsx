import { ReactNode, useCallback, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Typography, Box, Grid } from '@mui/material';
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

type RawSigningModalProps = {
  open: boolean;
  qrData: string;
  onClose: VoidFunction;
};

const logger = getLogger(LOGGER_NAME_RELAY);

const RawSigningModal: React.FC<RawSigningModalProps> = (props) => {
  const { open, qrData, onClose: onCloseModal } = props;

  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [signingAlgorithm, setSigningAlgorithm] = useState<SigningAlgorithms | null>(null);

  const onDecode = useCallback(async (data: QrScanner.ScanResult) => {
    const decodedData = data.data;
    const parsed = getRelayParams('utility', decodedData) as RelayRawSignTxResponseParams;
    console.log('Parsed data:', parsed.signedMessage);
    const parsedMessage = parsed.signedMessage;
    setSignedMessage(parsedMessage);
    const parsedAlgorithm = parsed.algorithm as SigningAlgorithms;
    setSigningAlgorithm(parsedAlgorithm);
  }, []);

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
        <Grid container spacing={1} alignItems='flex-start' justifyContent='center'>
          <Grid item xs={6}>
            <QrCode title='Relay URL' data={qrData} />
          </Grid>
          <Grid item xs={6}>
            <QrCodeScanner onDecode={onDecode} />
          </Grid>
        </Grid>
      ) : (
        <>
          <QrCode title='Signed Message' data={signedMessage} height='25rem' />
          <SignedMessage selectedAlgorithm={signingAlgorithm} signedMessage={signedMessage} />
        </>
      )}
    </BaseModal>
  );
};

export default RawSigningModal;
