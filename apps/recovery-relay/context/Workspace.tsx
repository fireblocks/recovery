import { createContext, useContext, ReactNode } from 'react';
import semver from 'semver';
import {
  useBaseWorkspace,
  defaultBaseWorkspaceContext,
  BaseWorkspaceContext,
  RelayRequestParams,
  RelayResponseParams,
  getLogger,
  sanatize,
  useOfflineQuery,
} from '@fireblocks/recovery-shared';
import { getAssetConfig } from '@fireblocks/asset-config';
import packageJson from '../package.json';
import { WalletClasses, Derivation } from '../lib/wallets';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

type RelayResponseParamsInput = DistributiveOmit<RelayResponseParams, 'version' | 'host' | 'ip'>;

type WorkspaceContext = Omit<BaseWorkspaceContext<Derivation, 'relay'>, 'getOutboundRelayUrl'> & {
  getOutboundRelayUrl: <Params extends RelayResponseParamsInput>(params: Params) => string;
};

const logger = getLogger(LOGGER_NAME_RELAY);

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

  logger.info('Checking for Recovery Utility releases', { currentUtilityVersion, latestUtilityVersion });

  if (semver.gt(latestUtilityVersion, currentUtilityVersion)) {
    const releasesUrl = remotePackageJson.repository.replace(/tree.*/g, 'releases');

    return releasesUrl;
  }

  return null;
};

const getInboundRelayWalletIds = (inboundRelayParams?: RelayRequestParams) => {
  if (!inboundRelayParams) {
    logger.warn('No inbound relay params.');
    return null;
  }

  logger.info('Inbound Relay params', inboundRelayParams);
  let ret;
  switch (inboundRelayParams.action) {
    case 'import':
      ret = {
        accountId: inboundRelayParams.accountId,
        assetId: inboundRelayParams.assetId,
      };
      break;
    case 'tx/create':
      ret = {
        accountId: inboundRelayParams.accountId,
        assetId: inboundRelayParams.newTx.assetId,
      };
      break;
    case 'tx/broadcast':
      ret = {
        accountId: inboundRelayParams.signedTx.path[2],
        assetId: inboundRelayParams.signedTx.assetId,
      };
      break;
    default:
      //@ts-ignore
      logger.info('Unknown action', inboundRelayParams.action);
      return null;
  }
  logger.info('getting inbound relay wallet ids', ret);
  return ret;
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
      const nativeAssetId = (getAssetConfig(input.assetId)?.nativeAsset ?? input.assetId) as keyof typeof WalletClasses;

      if (nativeAssetId in WalletClasses) {
        return new WalletClasses[nativeAssetId](input, 0);
      }

      throw new Error(`Unsupported asset: ${input.assetId}`);
    },
  });

  const ipQuery = useOfflineQuery({
    queryKey: ['ip'],
    refetchOnWindowFocus: false,
    queryFn: fetchIpAddress,
    onError: (err: Error) => console.error(err),
  });

  const utilityReleasesQuery = useOfflineQuery({
    queryKey: ['utilityReleasesUrl', inboundRelayParams?.version],
    enabled: !!inboundRelayParams?.version,
    refetchOnWindowFocus: false,
    queryFn: async () => fetchUtilityReleasesUrl(inboundRelayParams?.version ?? ''),
    onError: (err: Error) => console.error('Failed to check for Recovery Utility releases', err),
  });

  const extendedPublicKeysQuery = useOfflineQuery({
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

  const relayWalletQuery = useOfflineQuery({
    queryKey: ['relayWallet', extendedKeys, inboundRelayWalletIds],
    enabled: !!extendedKeys?.xpub && !!extendedKeys?.fpub && !!inboundRelayWalletIds,
    queryFn: async () => {
      const { accountId, assetId } = inboundRelayWalletIds!;
      logger.debug(`Relay wallet query for asset ${assetId} on account ${accountId}`);
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

  logger.info('Relay query results', {
    inboundRelayWalletIds,
    ipQuery: ipQuery.data,
    utilityReleasesQuery: utilityReleasesQuery.data,
    extendedKeysUpdateQuery: sanatize(extendedPublicKeysQuery.data),
    relayWalletQuery: sanatize(relayWalletQuery.data),
    // walletBalancesQueries: walletBalancesQueries.map((query) => query.data),
  });

  const getOutboundRelayUrl = <Params extends RelayResponseParamsInput>(params: Params) =>
    baseGetOutboundRelayUrl({
      ...params,
      version: packageJson.version,
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
