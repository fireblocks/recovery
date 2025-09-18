import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { Input, BaseWallet } from '@fireblocks/wallet-derivation';
import { LocalFile } from 'papaparse';
import { RecoveredKey } from '@fireblocks/extended-key-recovery/src/types';
import { AddressesCsv } from '../../schemas/addressesCsv';
// import { BalancesCsv } from '../../schemas/balancesCsv';
import { type UtilityExtendedKeys, type KeysetMap, RelayExtendedKeys } from '../../schemas';
import { Wallet, VaultAccount, Transaction } from '../../types';
import { BaseWorkspaceInput, BaseWorkspace, BaseWorkspaceContext } from './types';
import { csvImport } from '../../lib/csv';
import { useRelayUrl } from './useRelayUrl';
import { reduceDerivations, testIsLegacy, DerivationReducerInput } from './reduceDerivations';
import { reduceTransactions } from './reduceTransactions';
import { LOGGER_NAME_SHARED } from '../../constants';
import { getLogger } from '../../lib/getLogger';
import { sanatize } from '../../lib/sanatize';
import { useWrappedState } from '../../lib/debugUtils';

export type { BaseWorkspace, BaseWorkspaceContext };

const logger = getLogger(LOGGER_NAME_SHARED);

const defaultBaseWorkspaceInput: BaseWorkspaceInput<'utility', BaseWallet> = {
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
  resetInboundRelayUrl: () => {},
  getOutboundRelayUrl: () => '',
  setExtendedKeys: () => undefined,
  getExtendedKeysForAccountId: () => undefined,
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

  const { inboundRelayParams, setInboundRelayUrl, getOutboundRelayUrl, resetInboundRelayUrl } = useRelayUrl(app, relayBaseUrl);

  const [workspace, setWorkspace] = useWrappedState<BaseWorkspaceInput<App, Derivation>>(
    'workspace',
    defaultBaseWorkspaceInput as BaseWorkspaceInput<App, Derivation>,
    true,
  );

  const account = typeof query.accountId === 'string' ? workspace.accounts.get(parseInt(query.accountId, 10)) : undefined;

  const getExtendedKeysForAccountId = (
    accountId: number,
  ): { xpub: string; fpub: string; xprv?: string; fprv?: string } | undefined => {
    if (app === 'relay') {
      return undefined;
    }

    const keysets = Object.entries(workspace.extendedKeys || {}).filter(([keysetId]) => keysetId !== 'ncwMaster') as [
      string,
      RecoveredKey,
    ][];
    if (keysets.length === 0) {
      return undefined;
    }

    // We want to find the xpub and fpub for the extended keys that match the required accountId.
    let xpub: string | undefined;
    let xprv: string | undefined;
    let fpub: string | undefined;
    let fprv: string | undefined;
    const ecdsaKeyset = Object.values(keysets).findLast(([, key]) =>
      key.ecdsaExists ? key.ecdsaMinAccount <= accountId : false,
    );
    if (ecdsaKeyset !== undefined) {
      xpub = ecdsaKeyset[1].xpub;
      xprv = ecdsaKeyset[1].xprv;
    }
    const eddsaKeyset = Object.values(keysets).findLast(([, key]) =>
      key.eddsaExists ? key.eddsaMinAccount <= accountId : false,
    );
    if (eddsaKeyset !== undefined) {
      fpub = eddsaKeyset[1].fpub;
      fprv = eddsaKeyset[1].fprv;
    }

    if (!xpub || !fpub) {
      return undefined;
    }
    return { xpub, fpub, xprv, fprv };
  };

  const setExtendedKeys = (extendedKeys: App extends 'utility' ? UtilityExtendedKeys : RelayExtendedKeys) =>
    setWorkspace((prev) => {
      if (app === 'utility') {
        const keys = extendedKeys as UtilityExtendedKeys;
        const newExtendedKeys: KeysetMap = { ...prev.extendedKeys };
        const newWorkspace = {
          ...prev,
          ncwMaster: keys.ncwMaster,
        };
        Object.entries(keys).forEach(([keysetId, value]) => {
          if (keysetId === 'ncwMaster') {
            return;
          }
          const keysetEntry = value as RecoveredKey;
          newExtendedKeys[Number(keysetId)] = {
            ...keysetEntry,
            ...(app === 'utility' ? { xprv: keysetEntry.xprv, fprv: keysetEntry.fprv } : {}),
          };
        });

        newWorkspace.extendedKeys = { ...newExtendedKeys };

        return newWorkspace;
      }
      const { xpub, fpub } = extendedKeys as RelayExtendedKeys;
      return {
        ...prev,
        extendedKeys: {
          ...prev.extendedKeys,
          xpub,
          fpub,
        },
      };
    });

  const setDerivation = (
    derivationInput: Omit<DerivationReducerInput<Derivation, App>, 'accounts' | 'deriveWallet'> & {
      extendedKeys?: UtilityExtendedKeys;
    },
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
      const sanatizedRow = sanatize(parsedRow);
      logger.debug('CSV row to be parsed: ', sanatizedRow);
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
    (name: string, newAccountId?: number, mapAccountToNextKeysetEntry?: boolean, ecdsa?: boolean) => {
      let resolvedAccountId = newAccountId;
      logger.info(`Adding new vault account: ${name} ${newAccountId ? ` - ${newAccountId}` : ''}`);

      setWorkspace((prev) => {
        const accounts = new Map(prev.accounts);
        const { extendedKeys } = prev;

        if (mapAccountToNextKeysetEntry === true) {
          const entry = Object.entries(extendedKeys || {})
            .filter(([keyset]) => keyset !== 'ncwMaster')
            .find(([, value]) => {
              const key = value as RecoveredKey;
              if (ecdsa) return key.ecdsaExists && key.ecdsaMinAccount === -1;
              if (!ecdsa) return key.eddsaExists && key.eddsaMinAccount === -1;
              return false;
            });

          if (entry === undefined) {
            throw new Error(`Could not find vacant key mapping for ${ecdsa ? 'ECDSA' : 'EDDSA'} algorithm.`);
          }

          if (ecdsa) {
            (extendedKeys as Record<number, RecoveredKey>)[Number(entry[0])].ecdsaMinAccount =
              !newAccountId || newAccountId < 0 ? accounts.size : newAccountId;
          }
          if (!ecdsa) {
            (extendedKeys as Record<number, RecoveredKey>)[Number(entry[0])].eddsaMinAccount =
              !newAccountId || newAccountId < 0 ? accounts.size : newAccountId;
          }
        }

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

        return { ...prev, accounts, extendedKeys };
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
    setWorkspace(defaultBaseWorkspaceInput as BaseWorkspaceInput<App, Derivation>);
    push('/');
  };

  const value: BaseWorkspaceContext<Derivation, App> = {
    extendedKeys: workspace.extendedKeys,
    account,
    accounts: workspace.accounts,
    transactions: workspace.transactions,
    inboundRelayParams,
    setInboundRelayUrl,
    resetInboundRelayUrl,
    getOutboundRelayUrl,
    getExtendedKeysForAccountId,
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
