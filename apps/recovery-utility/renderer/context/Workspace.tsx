import { createContext, useContext, useEffect, ReactNode } from 'react';
import {
  useBaseWorkspace,
  defaultBaseWorkspaceContext,
  BaseWorkspaceContext,
  RelayRequestParams,
} from '@fireblocks/recovery-shared';
import { BaseWallet, deriveWallet } from '@fireblocks/wallet-derivation';
import { useRouter } from 'next/router';
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

const Context = createContext<WorkspaceContext>(defaultBaseWorkspaceContext as BaseWorkspaceContext<SigningWallet, 'utility'>);

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
    deriveWallet,
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

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info('Settings', settings);
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
