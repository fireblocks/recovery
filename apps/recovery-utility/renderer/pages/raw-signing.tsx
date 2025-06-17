'use client';
import React, { Suspense, useCallback, useState } from 'react';
import { BoxButton } from '.';
import { Grid } from '@mui/material';
import { useWorkspace } from '../context/Workspace';
import EditNoteIcon from '@mui/icons-material/EditNote';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useRawSignMessage } from '@fireblocks/recovery-shared/hooks/useRawSignMessage';
import Signature from '@fireblocks/recovery-shared/components/RawSigningForm/Signature';
import { BaseModal } from '@fireblocks/recovery-shared';
import { SignMessageParams } from '@fireblocks/recovery-shared/components';

const RawSigningForm = React.lazy(() => import('@fireblocks/recovery-shared/components/RawSigningForm'));
const RawSigningModal = React.lazy(() => import('../components/Modals/RawSigningModal'));

enum PageStatus {
  STATUS_SELECTION = 'statusSelection',
  GENERATE_SIGNATURE = 'generateSignature',
  SIGN_QR = 'signQr',
}

const RawSigning: React.FC = () => {
  const { extendedKeys, accounts } = useWorkspace();

  const [pageStatus, setPageStatus] = useState<PageStatus>(PageStatus.STATUS_SELECTION);
  const [isSignedModalOpen, setIsSignedModalOpen] = useState<boolean>(false);

  const handleCloseQRModal = () => {
    setPageStatus(PageStatus.STATUS_SELECTION);
  };

  const { generateSignature, signature, selectedAlgorithm } = useRawSignMessage(extendedKeys);

  const handleSigningMessage = useCallback(
    async ({
      unsignedMessage,
      rawSignMethod,
      selectedWallet,
      inputChangeIndex,
      inputAdressIndex,
      derivationPath,
      dpAlgorithm,
    }: SignMessageParams) => {
      try {
        await generateSignature({
          unsignedMessage,
          rawSignMethod,
          selectedWallet,
          inputChangeIndex,
          inputAdressIndex,
          derivationPath,
          dpAlgorithm,
        });
        setIsSignedModalOpen(true);
      } catch (error) {
        console.error(`utility raw signing error - ${error}`);
      }
    },
    [signature, isSignedModalOpen],
  );

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
                setIsSignedModalOpen(true);
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
          <Suspense>
            <RawSigningForm accounts={accounts} onSubmit={handleSigningMessage} />
          </Suspense>

          {signature && (
            <BaseModal
              open={isSignedModalOpen}
              onClose={() => {
                setIsSignedModalOpen(false);
              }}
              title='Signature'
            >
              <Signature selectedAlgorithm={selectedAlgorithm} signature={signature} />
            </BaseModal>
          )}
        </>
      )}
      <Suspense>
        <RawSigningModal open={pageStatus === PageStatus.SIGN_QR} onClose={handleCloseQRModal} />
      </Suspense>
    </>
  );
};

export default RawSigning;
