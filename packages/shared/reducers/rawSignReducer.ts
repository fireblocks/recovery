import { HDPath } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../../../apps/recovery-utility/renderer/lib/wallets/SigningWallet';

export enum RawSignMethod {
  ACCOUNT = 'account',
  DERIVATION_PATH = 'derivationPath',
}

export enum SigningAlgorithms {
  ECDSA = 'ECDSA',
  EDDSA = 'EDDSA',
}

export type SigningWalletWithSign = SigningWallet & {
  sign?: (message: string | Uint8Array, hasher?: (...msgs: Uint8Array[]) => Promise<Uint8Array>) => Promise<any>;
};

export type RawSignState = {
  rawSignMethod: RawSignMethod;
  selectedAccountId: number | null;
  selectedWallet: SigningWalletWithSign | null;
  inputChangeIndex: number;
  inputAdressIndex: number;
  derivationPath: HDPath;
  dpAlgorithm: SigningAlgorithms;
  unsignedTx: string | null;
  signedTx: string | null;
  qrData: string | null;
};

export type RawSignAction =
  | { type: 'SET_RAW_SIGN_METHOD'; payload: RawSignMethod }
  | { type: 'SET_SELECTED_ACCOUNT_ID'; payload: number | null }
  | { type: 'SET_SELECTED_WALLET'; payload: SigningWalletWithSign | null }
  | { type: 'SET_INPUT_CHANGE_INDEX'; payload: number }
  | { type: 'SET_INPUT_ADDRESS_INDEX'; payload: number }
  | { type: 'SET_DERIVATION_PATH'; payload: HDPath }
  | { type: 'SET_DP_ALGORITHM'; payload: SigningAlgorithms }
  | { type: 'SET_UNSIGNED_TX'; payload: string | null }
  | { type: 'SET_SIGNED_TX'; payload: string | null }
  | { type: 'SET_QR_DATA'; payload: string | null }
  | { type: 'RESET_WALLET_STATE' };

export const rawSignReducer = (state: RawSignState, action: RawSignAction): RawSignState => {
  switch (action.type) {
    case 'SET_RAW_SIGN_METHOD':
      return { ...state, rawSignMethod: action.payload };
    case 'SET_SELECTED_ACCOUNT_ID':
      return { ...state, selectedAccountId: action.payload };
    case 'SET_SELECTED_WALLET':
      return { ...state, selectedWallet: action.payload };
    case 'SET_INPUT_CHANGE_INDEX':
      return { ...state, inputChangeIndex: action.payload };
    case 'SET_INPUT_ADDRESS_INDEX':
      return { ...state, inputAdressIndex: action.payload };
    case 'SET_DERIVATION_PATH':
      return { ...state, derivationPath: action.payload };
    case 'SET_DP_ALGORITHM':
      return { ...state, dpAlgorithm: action.payload };
    case 'SET_UNSIGNED_TX':
      return { ...state, unsignedTx: action.payload };
    case 'SET_SIGNED_TX':
      return { ...state, signedTx: action.payload };
    case 'SET_QR_DATA':
      return { ...state, qrData: action.payload };
    case 'RESET_WALLET_STATE':
      return {
        ...state,
        signedTx: null,
        inputChangeIndex: 0,
        inputAdressIndex: 0,
      };
    default:
      return state;
  }
};
