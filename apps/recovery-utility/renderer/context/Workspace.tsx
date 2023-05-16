import { createContext, useContext, useEffect, ReactNode } from 'react';
import {
  useBaseWorkspace,
  defaultBaseWorkspaceContext,
  BaseWorkspaceContext,
  RelayRequestParams,
} from '@fireblocks/recovery-shared';
import { getAssetConfig } from '@fireblocks/asset-config';

import { useRouter } from 'next/router';
import { WalletClasses } from '../lib/wallets';
import packageJson from '../../package.json';
import { initIdleDetector } from '../lib/idleDetector';
import { handleRelayUrl } from '../lib/ipc/handleRelayUrl';
import { SigningWallet } from '../lib/wallets/SigningWallet';
import { useSettings } from './Settings';

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

type RelayRequestParamsInput = DistributiveOmit<RelayRequestParams, 'xpub' | 'fpub' | 'version' | 'platform'>;

type WorkspaceContext = Omit<BaseWorkspaceContext<SigningWallet, 'utility'>, 'setWalletBalance' | 'getOutboundRelayUrl'> & {
  getOutboundRelayUrl: <Params extends RelayRequestParamsInput>(params: Params) => string;
};

const defaultValue: WorkspaceContext = {
  ...(defaultBaseWorkspaceContext as BaseWorkspaceContext<SigningWallet, 'utility'>),
  getOutboundRelayUrl: () => '',
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WorkspaceProvider = ({ children }: Props) => {
  const { push } = useRouter();

  const settings = useSettings();

  const { relayBaseUrl, idleMinutes } = settings;

  const {
    extendedKeys,
    account,
    accounts,
    transactions,
    inboundRelayParams,
    setInboundRelayUrl,
    getOutboundRelayUrl: baseGetOutboundRelayUrl,
    importCsv,
    setExtendedKeys,
    setTransaction,
    addAccount,
    addWallet,
    reset,
  } = useBaseWorkspace({
    app: 'utility',
    relayBaseUrl,
    deriveWallet: (input) => {
      const nativeAssetId = (getAssetConfig(input.assetId)?.nativeAsset?.id ?? input.assetId) as keyof typeof WalletClasses;

      const derivation = new WalletClasses[nativeAssetId](input);

      console.info('Deriving wallet with input', { input, derivation });
      console.info('Has generateTx method?', !!derivation.generateTx);

      if (nativeAssetId in WalletClasses) {
        return derivation;
      }

      throw new Error(`Unsupported asset: ${input.assetId}`);
    },
  });

  const getOutboundRelayUrl = <Params extends RelayRequestParamsInput>(params: Params) => {
    const { xpub, fpub } = extendedKeys || {};

    if (!xpub || !fpub) {
      throw new Error('Missing extended keys');
    }

    const platform = navigator.userAgentData?.platform ?? 'Unknown';

    return baseGetOutboundRelayUrl({
      xpub,
      fpub,
      version: packageJson.version,
      platform,
      ...params,
    });
  };

  useEffect(() => {
    let abortController: AbortController | undefined;

    const initIdleDetectorHook = async () => {
      abortController = await initIdleDetector(reset, idleMinutes);
    };

    initIdleDetectorHook();

    return () => abortController?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMinutes]);

  useEffect(() => {
    handleRelayUrl((relayUrl) => {
      setInboundRelayUrl(relayUrl);

      const pathname = new URL(relayUrl).pathname.replace('//', '/');

      push(pathname);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value: WorkspaceContext = {
    extendedKeys,
    account,
    accounts,
    transactions,
    inboundRelayParams,
    setInboundRelayUrl,
    getOutboundRelayUrl,
    importCsv,
    setExtendedKeys,
    setTransaction,
    addAccount,
    addWallet,
    reset,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
