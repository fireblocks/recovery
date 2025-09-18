import { useCallback } from 'react';
import { useRawSign } from '../../hooks/useRawSign';
import { HDPath } from '@fireblocks/wallet-derivation';
import DerivationPathInput from '../DerivationPathInput';
import { Button, Select, TextField, VaultAccount } from '@fireblocks/recovery-shared';
import { Box, Checkbox, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { SigningWallet } from '../../../../apps/recovery-utility/renderer/lib/wallets/SigningWallet';

// const logger = getLogger('utility');

export type SignMessageParams = {
  unsignedMessage: string;
  rawSignMethod: RawSignMethod;
  selectedWallet: SigningWalletWithSign | null;
  inputChangeIndex: number;
  inputAdressIndex: number;
  derivationPath: HDPath;
  dpAlgorithm: SigningAlgorithms;
};

type RawSigningFormProps = {
  accounts: Map<number, VaultAccount<SigningWallet>>;
  onSubmit: ({
    unsignedMessage,
    rawSignMethod,
    selectedWallet,
    inputChangeIndex,
    inputAdressIndex,
    derivationPath,
    dpAlgorithm,
  }: SignMessageParams) => Promise<void>;
};

enum RawSignMethod {
  ACCOUNT = 'account',
  DERIVATION_PATH = 'derivationPath',
}

enum SigningAlgorithms {
  ECDSA = 'ECDSA',
  EDDSA = 'EDDSA',
}

type SigningWalletWithSign = SigningWallet & {
  sign?: (message: Uint8Array | string, hasher?: (...msgs: Uint8Array[]) => Promise<Uint8Array>) => Promise<any>;
};

const RawSigningForm: React.FC<RawSigningFormProps> = (props) => {
  const { accounts, onSubmit } = props;
  const {
    rawSignMethod,
    selectedAccountId,
    accountsArray,
    selectedWallet,
    walletOptions,
    inputAdressIndex,
    inputChangeIndex,
    dpAlgorithm,
    unsignedTx,
    appProtocol,
    derivationPath,
    handleRawSigningMethod,
    handleWalletChange,
    setSelectedAccountId,
    setInputChangeIndex,
    setSelectedWallet,
    setSignedTx,
    setInputAdressIndex,
    setDpAlgorithm,
    setDerivationPath,
    setUnignedTx,
  } = useRawSign(accounts);

  const handleOnSubmit = useCallback(async () => {
    if (!unsignedTx || (rawSignMethod === RawSignMethod.ACCOUNT && !selectedWallet)) {
      throw new Error('transaction was not provided');
    }
    await onSubmit({
      unsignedMessage: unsignedTx,
      rawSignMethod,
      selectedWallet,
      inputChangeIndex,
      inputAdressIndex,
      derivationPath,
      dpAlgorithm,
    });
  }, [unsignedTx, rawSignMethod, selectedWallet, inputChangeIndex, inputAdressIndex, derivationPath, dpAlgorithm]);

  return (
    <>
      <Box component='form' height='100%' display='flex' flexDirection='column'>
        <Typography variant='h1' component='h2' gutterBottom>
          Raw Signing
        </Typography>
        <Typography variant='body1' paragraph>
          Use this tool to sign messages with your Fireblocks keys by selecting assets either from your accounts or by specifying
          a custom derivation path. This secure signing process allows you to create cryptographic signatures for non-supported
          blockchain operations without exposing your private keys.
        </Typography>

        <Typography variant='h2' component='h2' gutterBottom sx={{ mt: 2 }}>
          Select Asset For Transaction Signature
        </Typography>

        <FormGroup>
          <FormControlLabel
            label='Choose from your accounts'
            control={<Checkbox />}
            checked={rawSignMethod === RawSignMethod.ACCOUNT}
            onChange={(_, checked) => {
              checked && handleRawSigningMethod(RawSignMethod.ACCOUNT);
            }}
          />
          <Box sx={{ pl: 4, pr: 4, width: '100%', display: 'flex', flexDirection: 'row', gap: 2 }}>
            <Select
              id='account'
              label='account'
              value={selectedAccountId !== null ? String(selectedAccountId) : ''}
              items={accountsArray.map((account) => ({ value: String(account.id), children: account.name }))}
              onChange={(e) => {
                setSelectedAccountId(Number(e.target.value));
                setSelectedWallet(null);
                setSignedTx(null);
              }}
              sx={{ flex: 1 }}
              disabled={rawSignMethod !== RawSignMethod.ACCOUNT}
            />

            <Select
              id='wallet'
              label='wallet'
              value={selectedWallet?.assetId ?? ''}
              onChange={handleWalletChange}
              items={walletOptions}
              sx={{ flex: 1 }}
              disabled={rawSignMethod !== RawSignMethod.ACCOUNT || selectedAccountId === null}
            />

            <TextField
              id='address'
              value={String(inputAdressIndex)}
              type='text'
              label='address'
              onChange={(e) => {
                setInputAdressIndex(Number(e.target.value));
              }}
              disabled={selectedWallet?.algorithm !== 'ECDSA'}
            />

            <TextField
              id='change'
              value={String(inputChangeIndex)}
              type='text'
              label='change'
              onChange={(e) => {
                setInputChangeIndex(Number(e.target.value));
              }}
              disabled={selectedWallet?.algorithm !== 'ECDSA'}
            />
          </Box>
        </FormGroup>

        <FormGroup>
          <FormControlLabel
            label='Custom derivation path'
            control={<Checkbox />}
            checked={rawSignMethod === RawSignMethod.DERIVATION_PATH}
            onChange={(_, checked) => {
              checked && handleRawSigningMethod(RawSignMethod.DERIVATION_PATH);
            }}
          />

          <Box sx={{ pl: 4, pr: 4, mb: 2, width: '100%', display: 'flex', flexDirection: 'row', gap: 2 }}>
            <DerivationPathInput
              disabled={rawSignMethod !== RawSignMethod.DERIVATION_PATH}
              onChange={(path) => setDerivationPath(path)}
            />
            <Select
              id='algoritm'
              value={dpAlgorithm}
              items={Object.values(SigningAlgorithms).map((algo) => ({ value: algo, children: algo.toUpperCase() }))}
              onChange={(event) => {
                setDpAlgorithm(event.target.value as SigningAlgorithms);
              }}
              sx={{ width: '124px' }}
              disabled={rawSignMethod !== RawSignMethod.DERIVATION_PATH}
            />
          </Box>
        </FormGroup>

        <FormGroup>
          <TextField
            id='unsigned-tx'
            value={unsignedTx || ''}
            type='text'
            label='Add input to sign'
            onChange={(e) => {
              setUnignedTx(e.target.value);
            }}
            sx={{ ml: 2, mr: 4 }}
          />
        </FormGroup>

        <Button
          sx={{ width: 'fit-content', mt: 2 }}
          color='primary'
          disabled={
            rawSignMethod === RawSignMethod.ACCOUNT
              ? !selectedWallet || unsignedTx === null || unsignedTx === ''
              : unsignedTx === null || unsignedTx === ''
          }
          onClick={handleOnSubmit}
        >
          {appProtocol === 'UTILITY' ? 'Generate Signature' : 'Generate QR'}
        </Button>
      </Box>
    </>
  );
};

export default RawSigningForm;
