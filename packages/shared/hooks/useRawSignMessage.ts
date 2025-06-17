import { useState, useCallback } from 'react';
import { Buffer } from 'buffer';
import { SignMessageParams } from '../components';
import { HDPathParts } from '@fireblocks/wallet-derivation';
import { ExtendedKeys, getLogger } from '@fireblocks/recovery-shared';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';
import { RawSignMethod, SigningAlgorithms } from '../reducers/rawSignReducer';
import { ECDSAWallet } from '@fireblocks/wallet-derivation/wallets/ECDSAWallet';
import { EdDSAWallet, sha512 } from '@fireblocks/wallet-derivation/wallets/EdDSAWallet';

class DerivationPathECDSAWallet extends ECDSAWallet {
  protected getAddress(evmAddress?: string): string {
    return evmAddress || '';
  }
  async signMessage(message: Uint8Array) {
    return await this.sign(message);
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

const formatECDSASignature = (signatureHex: string) => {
  if (signatureHex.startsWith('0x')) {
    signatureHex = signatureHex.slice(2);
  }

  if (signatureHex.length !== 130) {
    throw new Error('Invalid signature length');
  }

  const r = '0x' + signatureHex.slice(0, 64);
  const s = '0x' + signatureHex.slice(64, 128);
  const v = parseInt(signatureHex.slice(128, 130), 16);
  return {
    signature: signatureHex,
    r,
    s,
    v,
  };
};

export const useRawSignMessage = (extendedKeys?: ExtendedKeys) => {
  const [signature, setSignature] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SigningAlgorithms>(SigningAlgorithms.ECDSA);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logger = getLogger(LOGGER_NAME_UTILITY);

  const generateSignature = useCallback(
    async ({
      unsignedMessage,
      rawSignMethod,
      selectedWallet,
      inputChangeIndex,
      inputAdressIndex,
      derivationPath,
      dpAlgorithm,
    }: SignMessageParams) => {
      setIsLoading(true);
      try {
        if (!unsignedMessage) {
          throw new Error('transaction was not provided');
        }
        setSignature(null);
        const messageHashBuffer = Buffer.from(unsignedMessage, 'hex');

        const message = Uint8Array.from(messageHashBuffer);
        setSelectedAlgorithm(dpAlgorithm);

        if (rawSignMethod === RawSignMethod.ACCOUNT) {
          if (!selectedWallet || !selectedWallet.sign) {
            throw new Error('selected wallet error');
          }
          selectedWallet.path = { ...selectedWallet.path, changeIndex: inputChangeIndex, addressIndex: inputAdressIndex };
          const newPathParts: HDPathParts = [
            ...selectedWallet.pathParts.slice(0, -2),
            inputChangeIndex,
            inputAdressIndex,
          ] as HDPathParts;

          selectedWallet.pathParts = newPathParts;
          console.log('sign message - selectedWallet', selectedWallet);

          const sigHex = await selectedWallet.sign(message);

          const walletAlgorithm = selectedWallet.algorithm;

          switch (walletAlgorithm) {
            case 'EDDSA':
              const signatureString = Buffer.from(sigHex).toString('hex');
              console.log(signatureString);
              setSignature(signatureString || 'error');
              break;
            case 'ECDSA':
              const formattedSig = formatECDSASignature(sigHex);
              setSignature(JSON.stringify(formattedSig));
              break;
            default:
              throw new Error('Unknown wallet algorithm');
          }
        } else if (rawSignMethod === RawSignMethod.DERIVATION_PATH) {
          if (!extendedKeys?.xprv || !extendedKeys?.fprv || !extendedKeys?.xpub || !extendedKeys?.fpub) {
            throw new Error('Extended keys not provided');
          }

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
              setSignature(JSON.stringify(formattedSig));
              break;
            case SigningAlgorithms.EDDSA:
              const dpEDDSAWallet = new DerivationPathEDDSAWallet(dpParams, derivationPath.coinType);
              const eddsaSigHex = await dpEDDSAWallet.signMessage(message);
              const signatureString = Buffer.from(eddsaSigHex).toString('hex');
              console.log(signatureString);
              setSignature(signatureString || 'error');
              break;
            default:
              throw new Error('Derivation path algorithm error');
          }
        }
      } catch (error) {
        console.error(`generateSignature error - ${error}`);
        logger.error(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [extendedKeys],
  );

  return {
    generateSignature,
    signature,
    selectedAlgorithm,
    isLoading,
    setSignature,
    setSelectedAlgorithm,
  };
};
