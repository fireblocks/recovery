'use client';
import { useState } from 'react';
import { BoxButton } from '.';
import { Grid } from '@mui/material';
import { useWorkspace } from '../context/Workspace';
import EditNoteIcon from '@mui/icons-material/EditNote';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import RawSigningModal from '../components/Modals/RawSigningModal';
import RawSigningForm from '@fireblocks/recovery-shared/components/RawSigningForm';
import { useRawSignMessage } from '@fireblocks/recovery-shared/hooks/useRawSignMessage';
import SignedMessage from '@fireblocks/recovery-shared/components/RawSigningForm/SignedMessage';

enum PageStatus {
  STATUS_SELECTION = 'statusSelection',
  GENERATE_SIGNATURE = 'generateSignature',
  SIGN_QR = 'signQr',
}

const RawSigning: React.FC = () => {
  const { extendedKeys, accounts } = useWorkspace();

  const [pageStatus, setPageStatus] = useState<PageStatus>(PageStatus.STATUS_SELECTION);

  const handleCloseQRModal = () => {
    setPageStatus(PageStatus.STATUS_SELECTION);
  };

  const { signMessage, signedMessage, selectedAlgorithm } = useRawSignMessage(extendedKeys);

  return (
    <>
      {(pageStatus === PageStatus.STATUS_SELECTION || pageStatus === PageStatus.SIGN_QR) && (
        <Grid container spacing={2} display='flex' alignItems='center' justifyContent='center' height='100%'>
          <Grid item xs={4}>
            <BoxButton
              icon={EditNoteIcon}
              title='Generate Signature'
              description={''}
              color='error'
              onClick={() => {
                setPageStatus(PageStatus.GENERATE_SIGNATURE);
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <BoxButton
              icon={QrCodeScannerIcon}
              title='Sign via QR'
              description=''
              color='primary'
              onClick={() => {
                setPageStatus(PageStatus.SIGN_QR);
              }}
            />
          </Grid>
        </Grid>
      )}

      {pageStatus === PageStatus.GENERATE_SIGNATURE && (
        <>
          <RawSigningForm accounts={accounts} onSubmit={signMessage} />

          {signedMessage && <SignedMessage selectedAlgorithm={selectedAlgorithm} signedMessage={signedMessage} />}
        </>
      )}
      <RawSigningModal open={pageStatus === PageStatus.SIGN_QR} onClose={handleCloseQRModal} />
    </>
  );
};

export default RawSigning;
