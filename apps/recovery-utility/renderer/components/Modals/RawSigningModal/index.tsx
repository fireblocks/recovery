import { ReactNode } from 'react';
import { Typography, Box, Grid } from '@mui/material';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';
import { BaseModal, getLogger, QrCodeScanner, getRelayParams } from '@fireblocks/recovery-shared';

type RawSigningModalProps = {
  assetId?: string;
  accountId?: number;
  open: boolean;
  onClose: VoidFunction;
};

const logger = getLogger(LOGGER_NAME_UTILITY);

const RawSigningModal: React.FC<RawSigningModalProps> = (props) => {
  const { open, onClose: onCloseModal } = props;

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
              Raw Siging
            </Box>
          </Typography>
        ) as ReactNode
      }
    >
      <Grid item xs={6}>
        <QrCodeScanner
          onDecode={(data) => {
            const decodedData = data.data;
            const parsed = getRelayParams('utility', decodedData);
            console.log('Parsed data:', parsed);
          }}
        />
      </Grid>
    </BaseModal>
  );
};

export default RawSigningModal;
