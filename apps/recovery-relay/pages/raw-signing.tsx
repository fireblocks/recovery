'use client';
import { useState } from 'react';
import { useWorkspace } from '../context/Workspace';
import { QrCode } from '@fireblocks/recovery-shared';
import { HDPath } from '@fireblocks/wallet-derivation';
import { useSettings } from '../../recovery-utility/renderer/context/Settings';
import { DeploymentStore } from '../../recovery-utility/main/store/deployment';
import RawSigningForm from '@fireblocks/recovery-shared/components/RawSigningForm';
import { useRelayUrl } from '@fireblocks/recovery-shared/hooks/useBaseWorkspace/useRelayUrl';
import { RawSignMethod, SigningAlgorithms, SigningWalletWithSign } from '@fireblocks/recovery-shared/reducers/rawSignReducer';

const RawSigning: React.FC = () => {
  const { accounts } = useWorkspace();
  const settings = useSettings();

  const { relayBaseUrl } = settings;
  const deployment = DeploymentStore.get();
  const appProtocol = deployment.protocol;
  if (!appProtocol?.toUpperCase()) {
    return;
  }
  const { getOutboundRelayUrl } = useRelayUrl(appProtocol.toLowerCase() as 'utility' | 'relay', relayBaseUrl);
  const [qrData, setQrData] = useState<string | null>(null);

  const generateQr = async (
    unsignedTx: string,
    rawSignMethod: RawSignMethod,
    selectedWallet: SigningWalletWithSign,
    inputChangeIndex: number,
    inputAdressIndex: number,
    derivationPath: HDPath,
    dpAlgorithm: SigningAlgorithms,
  ) => {
    try {
      if (!getOutboundRelayUrl) {
        throw new Error('getOutboundRelayUrl error');
      }
      const txHashBuffer = Buffer.from(unsignedTx, 'hex');
      const message = Uint8Array.from(txHashBuffer);
      let data;
      let currentDerivationPath: HDPath = { coinType: 0, account: 0, changeIndex: 0, addressIndex: 0 };
      let algorithm: SigningAlgorithms = SigningAlgorithms.ECDSA;
      if (rawSignMethod === RawSignMethod.ACCOUNT) {
        if (!selectedWallet.sign) return;
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
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <RawSigningForm accounts={accounts} onSubmit={generateQr} />
      {qrData && (
        <>
          <br />
          <br />
          <br />
          <QrCode data={qrData} showRawData={false} />
          <br />
          <br />
          <br />
        </>
      )}
    </>
  );
};

export default RawSigning;
