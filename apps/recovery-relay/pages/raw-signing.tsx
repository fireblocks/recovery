'use client';
import React, { Suspense, useState } from 'react';
import { useWorkspace } from '../context/Workspace';
import { HDPath } from '@fireblocks/wallet-derivation';
import { useSettings } from '../../recovery-utility/renderer/context/Settings';
import { DeploymentStore } from '../../recovery-utility/main/store/deployment';
import { useRelayUrl } from '@fireblocks/recovery-shared/hooks/useBaseWorkspace/useRelayUrl';
import { RawSignMethod, SigningAlgorithms } from '@fireblocks/recovery-shared/reducers/rawSignReducer';
import RawSigningForm, { SignMessageParams } from '@fireblocks/recovery-shared/components/RawSigningForm';

const RawSigningModal = React.lazy(() => import('../components/RawSigningModal'));

const RawSigning: React.FC = () => {
  const { accounts } = useWorkspace();
  const settings = useSettings();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const { relayBaseUrl } = settings;
  const deployment = DeploymentStore.get();
  const appProtocol = deployment.protocol;
  if (!appProtocol?.toUpperCase()) {
    console.error('app protocol error');
  }
  const { getOutboundRelayUrl } = useRelayUrl('utility', relayBaseUrl);

  const generateQr = async ({
    unsignedMessage,
    rawSignMethod,
    selectedWallet,
    inputChangeIndex,
    inputAdressIndex,
    derivationPath,
    dpAlgorithm,
  }: SignMessageParams) => {
    try {
      if (!getOutboundRelayUrl) {
        throw new Error('getOutboundRelayUrl error');
      }
      const txHashBuffer = Buffer.from(unsignedMessage, 'hex');
      const message = Uint8Array.from(txHashBuffer);
      let data;
      let currentDerivationPath: HDPath = { coinType: 0, account: 0, changeIndex: 0, addressIndex: 0 };
      let algorithm: SigningAlgorithms = SigningAlgorithms.ECDSA;
      if (rawSignMethod === RawSignMethod.ACCOUNT) {
        if (!selectedWallet || !selectedWallet.sign) {
          throw new Error('selected wallet error');
        }
        currentDerivationPath = { ...selectedWallet.path, changeIndex: inputChangeIndex, addressIndex: inputAdressIndex };
        algorithm = selectedWallet.algorithm as SigningAlgorithms;
      } else if (rawSignMethod === RawSignMethod.DERIVATION_PATH) {
        currentDerivationPath = derivationPath;
        algorithm = dpAlgorithm;
      }
      data = getOutboundRelayUrl({
        action: 'tx/raw-sign',
        algorithm: algorithm,
        derivationPath: currentDerivationPath,
        message: message,
      });
      const baseUrl = relayBaseUrl !== '' ? relayBaseUrl : 'fireblocks-recovery:/';
      setQrData(`${baseUrl}${data}`);
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <RawSigningForm accounts={accounts} onSubmit={generateQr} />
      {qrData && isModalOpen && (
        <Suspense>
          <RawSigningModal
            open={qrData !== null}
            qrData={qrData}
            onClose={() => {
              setIsModalOpen(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default RawSigning;
