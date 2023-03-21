import { createContext, useContext, ReactNode } from 'react';
import semver from 'semver';
import {
  useBaseWorkspace,
  defaultBaseWorkspaceContext,
  BaseWorkspaceContext,
  RelayRequestParams,
  RelayResponseParams,
} from '@fireblocks/recovery-shared';
import { getAssetConfig } from '@fireblocks/asset-config';
import { useQuery, useQueries } from '@tanstack/react-query';
import packageJson from '../package.json';
import { WalletClasses, Derivation } from '../lib/wallets';

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

type RelayResponseParamsInput = DistributiveOmit<RelayResponseParams, 'version' | 'host' | 'ip'>;

type WorkspaceContext = Omit<BaseWorkspaceContext<Derivation, 'relay'>, 'getOutboundRelayUrl'> & {
  getOutboundRelayUrl: <Params extends RelayResponseParamsInput>(params: Params) => string;
};

const defaultValue: WorkspaceContext = {
  ...(defaultBaseWorkspaceContext as BaseWorkspaceContext<Derivation, 'relay'>),
  getOutboundRelayUrl: () => '',
};

const Context = createContext(defaultValue);

const fetchIpAddress = async () => fetch('https://api.ipify.org').then((res) => res.text());

const fetchUtilityReleasesUrl = async (currentUtilityVersion: string) => {
  const remotePackageJsonUrl = `${packageJson.repository
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/tree', '')
    .replace('recovery-relay', 'recovery-utility')}/package.json`;

  const remotePackageJson = (await fetch(remotePackageJsonUrl).then((res) => res.json())) as typeof packageJson;

  const latestUtilityVersion = remotePackageJson.version;

  if (semver.gt(latestUtilityVersion, currentUtilityVersion)) {
    const releasesUrl = remotePackageJson.repository.replace(/tree.*/g, 'releases');

    return releasesUrl;
  }

  return null;
};

const getInboundRelayWalletIds = (inboundRelayParams?: RelayRequestParams) => {
  if (!inboundRelayParams) {
    return null;
  }

  switch (inboundRelayParams.action) {
    case 'import':
      return {
        accountId: inboundRelayParams.accountId,
        assetId: inboundRelayParams.assetId,
      };
    case 'tx/create':
      return {
        accountId: inboundRelayParams.accountId,
        assetId: inboundRelayParams.newTx.assetId,
      };
    case 'tx/broadcast':
      return {
        accountId: inboundRelayParams.signedTx.path[2],
        assetId: inboundRelayParams.signedTx.assetId,
      };
    default:
      return null;
  }
};

type Props = {
  children: ReactNode;
};

export const WorkspaceProvider = ({ children }: Props) => {
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
    addWallet, // : baseAddWallet,
    setWalletBalance,
    reset: resetBaseWorkspace,
  } = useBaseWorkspace({
    app: 'relay',
    relayBaseUrl: 'fireblocks-recovery:/',
    deriveWallet: (input) => {
      const nativeAssetId = (getAssetConfig(input.assetId)?.nativeAsset?.id ?? input.assetId) as keyof typeof WalletClasses;

      if (nativeAssetId in WalletClasses) {
        return new WalletClasses[nativeAssetId](input);
      }

      throw new Error(`Unsupported asset: ${input.assetId}`);
    },
  });

  const ipQuery = useQuery({
    queryKey: ['ip'],
    refetchOnWindowFocus: false,
    queryFn: fetchIpAddress,
    onError: (err: Error) => console.error(err),
  });

  const utilityReleasesQuery = useQuery({
    queryKey: ['utilityReleasesUrl', inboundRelayParams?.version],
    enabled: !!inboundRelayParams?.version,
    refetchOnWindowFocus: false,
    queryFn: async () => fetchUtilityReleasesUrl(inboundRelayParams?.version ?? ''),
    onError: (err: Error) => console.error('Failed to check for Recovery Utility releases', err),
  });

  const extendedPublicKeysQuery = useQuery({
    queryKey: ['extendedPublicKeys', inboundRelayParams?.xpub, inboundRelayParams?.fpub],
    enabled: !!inboundRelayParams?.xpub || !!inboundRelayParams?.fpub,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const { xpub, fpub } = inboundRelayParams || {};
      setExtendedKeys({ xpub, fpub });
      return { xpub, fpub };
    },
    onError: (err: Error) => console.error('Failed to set extended public keys', err),
  });

  const inboundRelayWalletIds = getInboundRelayWalletIds(inboundRelayParams);

  const relayWalletQuery = useQuery({
    queryKey: ['relayWallet', extendedKeys, inboundRelayWalletIds],
    enabled: !!extendedKeys?.xpub && !!extendedKeys?.fpub && !!inboundRelayWalletIds,
    queryFn: async () => {
      const { accountId, assetId } = inboundRelayWalletIds!;

      return addWallet(assetId, accountId) ?? null;
    },
  });

  // const walletBalancesQueries = useQueries({
  //   queries: Array.from(accounts.values()).flatMap(({ id, wallets }) =>
  //     Array.from(wallets.values()).flatMap((wallet) => ({
  //       queryKey: ['balance', id, wallet.assetId],
  //       queryFn: async () => {
  //         const derivations = Array.from(wallet.derivations.values());

  //         const balancePromises = derivations.map((derivation) => derivation.getBalance?.());

  //         const nativeBalances = await Promise.all(balancePromises);

  //         const totalNativeBalance = nativeBalances.reduce((acc, balance) => acc + balance, 0);

  //         // TODO: If the balance after 20 sequential derivations is 0, return, else keep deriving and querying

  //         setWalletBalance(wallet.assetId, id, totalNativeBalance);

  //         return totalNativeBalance;
  //       },
  //       // onSuccess: (balance) => setWalletBalance(wallet.assetId, id, balance),
  //     })),
  //   ),
  // });

  console.info('Relay query results', {
    inboundRelayWalletIds,
    ipQuery: ipQuery.data,
    utilityReleasesQuery: utilityReleasesQuery.data,
    extendedKeysUpdateQuery: extendedPublicKeysQuery.data,
    relayWalletQuery: relayWalletQuery.data,
    // walletBalancesQueries: walletBalancesQueries.map((query) => query.data),
  });

  const getOutboundRelayUrl = <Params extends RelayResponseParamsInput>(params: Params) =>
    baseGetOutboundRelayUrl({
      ...params,
      version: packageJson.version,
      host: window.location.host,
      ip: ipQuery.data,
    });

  const reset = () => {
    setInboundRelayUrl(null);
    resetBaseWorkspace();
  };

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
    setWalletBalance,
    reset,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
