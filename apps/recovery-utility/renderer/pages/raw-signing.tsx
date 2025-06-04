'use client';
import { useCallback, useState } from 'react';
import { BoxButton } from '.';
import { Grid } from '@mui/material';
import { getBytes, keccak256 } from 'ethers';
import { useWorkspace } from '../context/Workspace';
import EditNoteIcon from '@mui/icons-material/EditNote';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import RawSigningModal from '../components/Modals/RawSigningModal';
import { HDPath, HDPathParts } from '@fireblocks/wallet-derivation';
import { ECDSAWallet } from '@fireblocks/wallet-derivation/wallets/ECDSAWallet';
import RawSigningForm from '@fireblocks/recovery-shared/components/RawSigningForm';
import SignedMessage from '@fireblocks/recovery-shared/components/RawSigningForm/SignedMessage';
import { EdDSAWallet, sha512 } from '@fireblocks/wallet-derivation/wallets/EdDSAWallet';
import { RawSignMethod, SigningAlgorithms, SigningWalletWithSign } from '@fireblocks/recovery-shared/reducers/rawSignReducer';

enum PageStatus {
  STATUS_SELECTION = 'statusSelection',
  GENERATE_SIGNATURE = 'generateSignature',
  SIGN_QR = 'signQr',
}

class DerivationPathECDSAWallet extends ECDSAWallet {
  protected getAddress(evmAddress?: string): string {
    return evmAddress || '';
  }
  async signMessage(message: string | Uint8Array, hasher = keccak256) {
    return await this.sign(message, hasher);
  }
}

class DerivationPathEDDSAWallet extends EdDSAWallet {
  protected getAddress(evmAddress?: string): string {
    return evmAddress || '';
  }

  async signMessage(message: string | Uint8Array, hasher: (...msgs: Uint8Array[]) => Promise<Uint8Array> = sha512) {
    return await this.sign(message, hasher);
  }
}

const RawSigning: React.FC = () => {
  const { extendedKeys, accounts } = useWorkspace();

  const [pageStatus, setPageStatus] = useState<PageStatus>(PageStatus.STATUS_SELECTION);
  const [signedTx, setSignedTx] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SigningAlgorithms>(SigningAlgorithms.ECDSA);

  const handleCloseQRModal = useCallback(() => {
    setPageStatus(PageStatus.STATUS_SELECTION);
  }, []);

  const formatECDSASignature = (signatureHex: string) => {
    const sigBytes = getBytes(signatureHex);

    const r = sigBytes.slice(0, 32);
    const s = sigBytes.slice(32, 64);
    const v = sigBytes[64];

    const rHex = Buffer.from(r).toString('hex');
    const sHex = Buffer.from(s).toString('hex');

    return {
      signature: signatureHex,
      r: rHex,
      s: sHex,
      v: v,
    };
  };

  const signTx = useCallback(
    async (
      unsignedTx: string,
      rawSignMethod: RawSignMethod,
      selectedWallet: SigningWalletWithSign,
      inputChangeIndex: number,
      inputAdressIndex: number,
      derivationPath: HDPath,
      dpAlgorithm: SigningAlgorithms,
    ) => {
      try {
        // const solUnsignedTx = 'ef45bc8da9622b709f4a3cdcc4d09ffb7e8fc2b7c3a9b87a17f0c0b7d8967e4d';

        // const bitcoinUnsignedTx = '0e3e2357e806b6cdb1f70b54c3a3a8e60d1f085437ff66e2c4e5a42c0a5f4f3c';

        if (!unsignedTx) {
          throw new Error('transaction was not provided');
        }
        setSignedTx(null);
        const txHashBuffer = Buffer.from(unsignedTx, 'hex');

        const message = Uint8Array.from(txHashBuffer);
        setSelectedAlgorithm(dpAlgorithm);
        if (rawSignMethod === RawSignMethod.ACCOUNT) {
          if (!selectedWallet.sign) {
            throw new Error('seleceted wallet has no signing func');
          }
          selectedWallet.path = { ...selectedWallet.path, changeIndex: inputChangeIndex, addressIndex: inputAdressIndex };
          const newPathParts: HDPathParts = [
            ...selectedWallet.pathParts.slice(0, -2),
            inputChangeIndex,
            inputAdressIndex,
          ] as HDPathParts;

          selectedWallet.pathParts = newPathParts;
          console.log('sign tx - selectedWallet', selectedWallet);

          const sigHex = await selectedWallet.sign(message);

          const walletAlgorithm = selectedWallet.algorithm;

          switch (walletAlgorithm) {
            case 'EDDSA':
              const signatureString = Buffer.from(sigHex).toString('hex');
              console.log(signatureString);
              setSignedTx(signatureString || 'error');

              break;
            case 'ECDSA':
              const formattedSig = formatECDSASignature(sigHex);

              setSignedTx(JSON.stringify(formattedSig));
              break;
            default:
              // logger.error('unkown wallet algorithm');
              break;
          }
        } else if (rawSignMethod === RawSignMethod.DERIVATION_PATH) {
          if (!extendedKeys?.xprv || !extendedKeys?.fprv || !extendedKeys?.xpub || !extendedKeys?.fpub) return;

          const dpParams = {
            xprv: extendedKeys?.xprv,
            fprv: extendedKeys?.fprv,
            xpub: extendedKeys?.xpub,
            fpub: extendedKeys?.fpub,
            assetId: String(derivationPath.coinType),
            path: derivationPath,
          };

          switch (dpAlgorithm) {
            case SigningAlgorithms.ECDSA:
              const dpECDSAWallet = new DerivationPathECDSAWallet(dpParams, derivationPath.coinType);
              const ecdsaSigHex = await dpECDSAWallet.signMessage(message);
              const formattedSig = formatECDSASignature(ecdsaSigHex);

              setSignedTx(JSON.stringify(formattedSig));
              break;
            case SigningAlgorithms.EDDSA:
              const dpEDDSAWallet = new DerivationPathEDDSAWallet(dpParams, derivationPath.coinType);
              const eddsaSigHex = await dpEDDSAWallet.signMessage(message);
              const signatureString = Buffer.from(eddsaSigHex).toString('hex');
              console.log(signatureString);
              setSignedTx(signatureString || 'error');

              break;
            default:
              console.error('dpAlgorithm error');
              // logger.error('Derivation path algorithm error');
              break;
          }
        }
      } catch (error) {
        console.error(`signTx error - ${error}`);
        //   logger.error(`sign tx error ${error}`);
      }
    },
    [],
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
          <RawSigningForm accounts={accounts} onSubmit={signTx} />

          {signedTx && <SignedMessage selectedAlgorithm={selectedAlgorithm} signedMessage={signedTx} />}
        </>
      )}
      <RawSigningModal open={pageStatus === PageStatus.SIGN_QR} onClose={handleCloseQRModal} />
    </>
  );
};

export default RawSigning;
