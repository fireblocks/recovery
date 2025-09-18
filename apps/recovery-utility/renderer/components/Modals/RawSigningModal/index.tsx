import { ReactNode, useEffect, useMemo, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Typography, Box, Grid, CircularProgress } from '@mui/material';
import { useSettings } from '../../../context/Settings';
import { useWorkspace } from '../../../context/Workspace';
import { DeploymentStore } from '../../../../main/store/deployment';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';
import { useRawSignMessage } from '@fireblocks/recovery-shared/hooks/useRawSignMessage';
import { useRelayUrl } from '@fireblocks/recovery-shared/hooks/useBaseWorkspace/useRelayUrl';
import { RawSignMethod, SigningAlgorithms } from '@fireblocks/recovery-shared/reducers/rawSignReducer';
import {
  BaseModal,
  getLogger,
  QrCodeScanner,
  getRelayParams,
  QrCode,
  RelayRawSignTxRequestParams,
} from '@fireblocks/recovery-shared';

type RawSigningModalProps = {
  assetId?: string;
  accountId?: number;
  open: boolean;
  onClose: VoidFunction;
};

const logger = getLogger(LOGGER_NAME_UTILITY);

const RawSigningModal: React.FC<RawSigningModalProps> = (props) => {
  const { open, onClose: onCloseModal } = props;
  const { extendedKeys } = useWorkspace();

  const settings = useSettings();
  const { relayBaseUrl } = settings;

  const deployment = DeploymentStore.get();
  const appProtocol = deployment.protocol;
  if (!appProtocol?.toUpperCase()) {
    console.error('app protocol error');
  }
  const { getOutboundRelayUrl } = useRelayUrl('relay', relayBaseUrl);

  const { generateSignature, signature, setSignature, selectedAlgorithm } = useRawSignMessage(extendedKeys);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onDecode = async (data: QrScanner.ScanResult) => {
    try {
      setIsProcessing(true);
      const decodedData = data.data;
      const parsed = getRelayParams('relay', decodedData) as RelayRawSignTxRequestParams;
      // console.log('Parsed data:', parsed.message);
      const unsignedMessage = Buffer.from(parsed.message).toString('hex');

      await generateSignature({
        unsignedMessage,
        rawSignMethod: RawSignMethod.DERIVATION_PATH,
        selectedWallet: null,
        inputChangeIndex: parsed.derivationPath.changeIndex,
        inputAdressIndex: parsed.derivationPath.addressIndex,
        derivationPath: parsed.derivationPath,
        dpAlgorithm: parsed.algorithm as SigningAlgorithms,
      });
      setTimeout(() => {
        setIsProcessing(false);
      }, 1250);
    } catch (error) {
      console.error('Error processing QR code:', error);
      setIsProcessing(false);
    }
  };

  const formattedSignedMessage = useMemo(() => {
    if (!signature) return null;
    const data = getOutboundRelayUrl({
      action: 'tx/broadcast-raw-sign',
      algorithm: selectedAlgorithm,
      signature: signature,
    });

    return data;
  }, [signature, selectedAlgorithm, relayBaseUrl, getOutboundRelayUrl]);

  const onClose = () => {
    setSignature(null);
    onCloseModal();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
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
      {!formattedSignedMessage ? (
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '25rem',
          }}
        >
          <QrCodeScanner onDecode={onDecode} />
        </Grid>
      ) : isProcessing ? (
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '25rem',
            height: '25rem',
          }}
        >
          <CircularProgress size={60} />
        </Grid>
      ) : (
        <QrCode data={formattedSignedMessage} title='Signature' showRawData={true} height='25rem' />
      )}
    </BaseModal>
  );
};

export default RawSigningModal;
