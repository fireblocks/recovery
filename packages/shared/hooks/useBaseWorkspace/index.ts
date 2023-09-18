import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Input, BaseWallet } from '@fireblocks/wallet-derivation';
import { LocalFile } from 'papaparse';
import { AddressesCsv } from '../../schemas/addressesCsv';
// import { BalancesCsv } from '../../schemas/balancesCsv';
import type { ExtendedKeys } from '../../schemas';
import { Wallet, VaultAccount, Transaction } from '../../types';
import { BaseWorkspaceInput, BaseWorkspace, BaseWorkspaceContext } from './types';
import { csvImport } from '../../lib/csv';
import { useRelayUrl } from './useRelayUrl';
import { reduceDerivations, testIsLegacy, DerivationReducerInput } from './reduceDerivations';
import { reduceTransactions } from './reduceTransactions';
import { LOGGER_NAME_SHARED } from '../../constants';
import { getLogger } from '../../lib/getLogger';

export type { BaseWorkspace, BaseWorkspaceContext };

const logger = getLogger(LOGGER_NAME_SHARED);

const defaultBaseWorkspaceInput: BaseWorkspaceInput<BaseWallet> = {
  extendedKeys: undefined,
  accounts: new Map<number, VaultAccount<BaseWallet>>(),
  transactions: new Map<string, Transaction>(),
};

const defaultBaseWorkspace: BaseWorkspace<BaseWallet> = {
  ...defaultBaseWorkspaceInput,
  account: undefined,
};

export const defaultBaseWorkspaceContext: BaseWorkspaceContext<BaseWallet> = {
  ...defaultBaseWorkspace,
  setInboundRelayUrl: () => false,
  getOutboundRelayUrl: () => '',
  setExtendedKeys: () => undefined,
  importCsv: () => Promise.resolve(),
  addAccount: () => 0,
  addWallet: () => undefined,
  setWalletBalance: () => undefined,
  setTransaction: () => undefined,
  reset: () => undefined,
};

type Props<App extends 'utility' | 'relay', Derivation extends BaseWallet> = {
  app: App;
  relayBaseUrl: string;
  deriveWallet: (input: Input) => Derivation;
};

export const useBaseWorkspace = <App extends 'utility' | 'relay', Derivation extends BaseWallet>({
  app,
  relayBaseUrl,
  deriveWallet,
}: Props<App, Derivation>) => {
  const { query, push } = useRouter();

  const { inboundRelayParams, setInboundRelayUrl, getOutboundRelayUrl } = useRelayUrl(app, relayBaseUrl);

  const [workspace, setWorkspace] = useState<BaseWorkspaceInput<Derivation>>(
    defaultBaseWorkspaceInput as BaseWorkspaceInput<Derivation>,
  );

  const account = typeof query.accountId === 'string' ? workspace.accounts.get(parseInt(query.accountId, 10)) : undefined;

  const setExtendedKeys = ({ xpub, fpub, xprv, fprv }: Partial<ExtendedKeys>) =>
    setWorkspace((prev) => ({
      ...prev,
      extendedKeys: {
        ...prev.extendedKeys,
        ...(app === 'utility' ? { xprv, fprv } : {}),
        xpub,
        fpub,
      },
    }));

  const setDerivation = (
    derivationInput: Omit<DerivationReducerInput<Derivation>, 'accounts' | 'deriveWallet'> & { extendedKeys?: ExtendedKeys },
    setDerivationError?: (err: string) => void,
  ) => {
    setWorkspace((prev) => {
      const accounts = new Map(prev.accounts);
      try {
        const updatedAccount = reduceDerivations({
          ...derivationInput,
          deriveWallet,
          accounts,
          extendedKeys: {
            ...prev.extendedKeys,
            ...derivationInput.extendedKeys,
          },
        });

        accounts.set(updatedAccount.id, updatedAccount);

        return { ...prev, accounts };
      } catch (e) {
        logger.error(`Failed to derive wallet: ${(e as Error).message}`);
        if (setDerivationError !== undefined) {
          setDerivationError((e as Error).message);
        }
        return { ...prev };
      }
    });
  };

  const handleAddressCsvRow = useCallback(
    (parsedRow: AddressesCsv, extendedKeys = workspace.extendedKeys) => {
      logger.debug('CSV row to be parsed: ', parsedRow);
      const {
        assetId,
        accountName,
        pathParts,
        address,
        addressType,
        addressDescription,
        tag,
        publicKey,
        privateKey,
        privateKeyWif,
      } = parsedRow;

      const [, coinType, accountId, changeIndex, addressIndex] = pathParts;
      setDerivation({
        extendedKeys,
        assetId,
        accountId,
        accountName,
        path: {
          coinType,
          changeIndex,
          addressIndex,
        },
        address,
        type: addressType,
        description: addressDescription,
        tag,
        publicKey,
        isTestnet: assetId.includes('TEST'),
        isLegacy: testIsLegacy(assetId, address),
        ...(app === 'utility' ? { privateKey, privateKeyWif } : {}),
      });
    },
    [setDerivation, workspace.extendedKeys],
  );

  const importCsv = async (addressesCsv?: LocalFile, balancesCsv?: LocalFile) => {
    if (addressesCsv) {
      await csvImport(addressesCsv, 'addresses', handleAddressCsvRow);
    }

    if (balancesCsv) {
      // await csvImport(balancesCsv, 'balances', handleCsvRow);
      // TODO: Update balances of wallets (row.totalBalance)
    }
  };

  const addAccount = useCallback(
    (name: string, newAccountId?: number) => {
      let resolvedAccountId = newAccountId;
      logger.info(`Adding new vault account: ${name} ${newAccountId ? ' - ' + newAccountId : ''}`);

      setWorkspace((prev) => {
        const accounts = new Map(prev.accounts);

        if (typeof resolvedAccountId === 'undefined') {
          if (accounts.size > 0) {
            const accountIds = Array.from(accounts.keys());

            resolvedAccountId = Math.max(...accountIds) + 1;
          } else {
            resolvedAccountId = 0;
          }
        }

        const newAccount: VaultAccount<Derivation> = {
          id: resolvedAccountId,
          name,
          ...accounts.get(resolvedAccountId),
          wallets: new Map<string, Wallet<Derivation>>(),
        };

        accounts.set(resolvedAccountId, newAccount);

        return { ...prev, accounts };
      });

      return resolvedAccountId ?? 0;
    },
    [setWorkspace],
  );

  const addWallet = (assetId: string, accountId: number, setDerivationError?: (err: string) => void, addressIndex = 0) => {
    if (typeof accountId !== 'number') {
      throw new Error('Wallet needs an account ID');
    }

    if (typeof assetId !== 'string') {
      throw new Error('Wallet needs an asset ID');
    }

    logger.info(`Adding new wallet in vault account ${accountId}: ${assetId} - ${addressIndex}`);

    setDerivation(
      {
        assetId,
        accountId,
        path: { addressIndex },
      },
      setDerivationError,
    );

    return workspace.accounts.get(accountId)?.wallets.get(assetId);
  };

  const setWalletBalance = (assetId: string, accountId: number, balance: number) =>
    setWorkspace((prev) => {
      const accounts = new Map(prev.accounts);

      const updatedAccount = accounts.get(accountId);

      const wallets = new Map(updatedAccount?.wallets);

      const wallet = wallets?.get(assetId);

      if (!updatedAccount || !wallet) {
        return prev;
      }

      wallet.balance = {
        ...wallet.balance,
        native: balance,
      };

      wallet.lastUpdated = new Date();

      updatedAccount.wallets.set(assetId, wallet);

      accounts.set(accountId, updatedAccount);

      return { ...prev, accounts };
    });

  const setTransaction = (tx: Transaction) =>
    setWorkspace((prev) => ({
      ...prev,
      transactions: reduceTransactions(prev.transactions, tx),
    }));

  const reset = () => {
    setWorkspace(defaultBaseWorkspaceInput as BaseWorkspaceInput<Derivation>);
    push('/');
  };

  const value: BaseWorkspaceContext<Derivation, App> = {
    extendedKeys: workspace.extendedKeys,
    account,
    accounts: workspace.accounts,
    transactions: workspace.transactions,
    inboundRelayParams,
    setInboundRelayUrl,
    getOutboundRelayUrl,
    setExtendedKeys,
    importCsv,
    setTransaction,
    addAccount,
    addWallet,
    setWalletBalance,
    reset,
  };

  return value;
};
