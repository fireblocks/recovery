import { ReactNode, useEffect, useMemo } from 'react';
import QrScanner from 'qr-scanner';
import { Typography, Box, Grid } from '@mui/material';
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

  const { signMessage, signedMessage, setSignedMessage, selectedAlgorithm } = useRawSignMessage(extendedKeys);

  const onDecode = async (data: QrScanner.ScanResult) => {
    const decodedData = data.data;
    const parsed = getRelayParams('relay', decodedData) as RelayRawSignTxRequestParams;
    console.log('Parsed data:', parsed.message);
    const unsignedMessage = Buffer.from(parsed.message).toString('hex');

    await signMessage({
      unsignedMessage,
      rawSignMethod: RawSignMethod.DERIVATION_PATH,
      inputChangeIndex: parsed.derivationPath.changeIndex,
      inputAdressIndex: parsed.derivationPath.addressIndex,
      derivationPath: parsed.derivationPath,
      dpAlgorithm: parsed.algorithm as SigningAlgorithms,
    });
  };

  useEffect(() => {
    console.log(signedMessage);
  }, [signedMessage]);

  const formattedSignedMessage = useMemo(() => {
    if (!signedMessage) return null;
    const data = getOutboundRelayUrl({
      action: 'tx/broadcast-raw-sign',
      algorithm: selectedAlgorithm,
      signedMessage: signedMessage,
    });

    return data;
  }, [signedMessage, selectedAlgorithm, relayBaseUrl, getOutboundRelayUrl]);

  const onClose = () => {
    logger.info(`Closing raw-signing modal`);
    setSignedMessage(null);
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
      {!formattedSignedMessage ? (
        <Grid item xs={6}>
          <QrCodeScanner onDecode={onDecode} />
        </Grid>
      ) : (
        <QrCode data={formattedSignedMessage} showRawData={false} />
      )}
    </BaseModal>
  );
};

export default RawSigningModal;
