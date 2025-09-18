import { useCallback, useMemo, useReducer } from 'react';
import { VaultAccount } from '../types';
import { SelectChangeEvent } from '@mui/material';
import { HDPath } from '@fireblocks/wallet-derivation';
import { getAssetConfig } from '@fireblocks/asset-config';
import { getDerivationMapKey } from '../lib/getDerivation';
import { DeploymentStore } from '../../../apps/recovery-utility/main/store/deployment';
import { SigningWallet } from '../../../apps/recovery-utility/renderer/lib/wallets/SigningWallet';
import {
  RawSignMethod,
  rawSignReducer,
  RawSignState,
  SigningAlgorithms,
  SigningWalletWithSign,
} from '../reducers/rawSignReducer';

export const useRawSign = (accounts: Map<number, VaultAccount<SigningWallet>>) => {
  const initialState: RawSignState = {
    rawSignMethod: RawSignMethod.ACCOUNT,
    selectedAccountId: null,
    selectedWallet: null,
    inputChangeIndex: 0,
    inputAdressIndex: 0,
    derivationPath: { coinType: 0, account: 0, changeIndex: 0, addressIndex: 0 },
    dpAlgorithm: SigningAlgorithms.ECDSA,
    unsignedTx: null,
    signedTx: null,
    qrData: null,
  };

  const [state, dispatch] = useReducer(rawSignReducer, initialState);

  const deployment = DeploymentStore.get();
  const appProtocol = deployment.protocol;

  const accountsArray = useMemo(() => Array.from(accounts.values()), [accounts]);

  const handleRawSigningMethod = (method: RawSignMethod) => {
    dispatch({ type: 'SET_RAW_SIGN_METHOD', payload: method });
  };

  const walletOptions = useMemo(() => {
    if (state.selectedAccountId === null) return [];

    const selectedAccount = accountsArray.find((acc) => acc.id === state.selectedAccountId);
    const currentWallets = selectedAccount?.wallets;

    return currentWallets
      ? Array.from(currentWallets).map(([walletId, wallet]) => ({
          value: walletId,
          children: wallet.assetId,
        }))
      : [];
  }, [state.selectedAccountId, accountsArray]);

  const handleWalletChange = useCallback(
    (event: SelectChangeEvent<unknown>) => {
      dispatch({ type: 'RESET_WALLET_STATE' });

      const walletId = event.target.value as string;

      const selectedAccount = accountsArray.find((acc) => acc.id === state.selectedAccountId);
      const wallet = selectedAccount?.wallets.get(walletId) || null;
      if (!wallet) return;

      const assetId = wallet.assetId;
      const selectedAsset = getAssetConfig(assetId);
      if (!selectedAsset) return;

      const firstEntry = Array.from(wallet.derivations.values()).find((entry: any) => entry.address);
      const address = firstEntry?.address;
      if (!address) return;

      const derivationMapKey = getDerivationMapKey(selectedAsset.id, address);
      const derivation = wallet.derivations.get(derivationMapKey);
      if (!derivation) return;

      dispatch({ type: 'SET_SELECTED_WALLET', payload: derivation });
      dispatch({ type: 'SET_DP_ALGORITHM', payload: derivation.algorithm as SigningAlgorithms });
    },
    [state.selectedAccountId, accountsArray],
  );

  return {
    ...state,
    accountsArray,
    walletOptions,
    appProtocol,
    handleRawSigningMethod,
    handleWalletChange,
    setSelectedAccountId: (id: number | null) => dispatch({ type: 'SET_SELECTED_ACCOUNT_ID', payload: id }),
    setSelectedWallet: (wallet: SigningWalletWithSign | null) => dispatch({ type: 'SET_SELECTED_WALLET', payload: wallet }),
    setInputChangeIndex: (index: number) => dispatch({ type: 'SET_INPUT_CHANGE_INDEX', payload: index }),
    setInputAdressIndex: (index: number) => dispatch({ type: 'SET_INPUT_ADDRESS_INDEX', payload: index }),
    setDerivationPath: (path: HDPath) => dispatch({ type: 'SET_DERIVATION_PATH', payload: path }),
    setDpAlgorithm: (algo: SigningAlgorithms) => dispatch({ type: 'SET_DP_ALGORITHM', payload: algo }),
    setUnignedTx: (tx: string | null) => dispatch({ type: 'SET_UNSIGNED_TX', payload: tx }),
    setSignedTx: (tx: string | null) => dispatch({ type: 'SET_SIGNED_TX', payload: tx }),
    setQrData: (data: string | null) => dispatch({ type: 'SET_QR_DATA', payload: data }),
  };
};
