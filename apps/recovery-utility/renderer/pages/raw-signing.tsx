'use client';
import { useCallback, useMemo, useState } from 'react';
import { getBytes, keccak256 } from 'ethers';
import { useWorkspace } from '../context/Workspace';
import { HDPath } from '@fireblocks/wallet-derivation';
import { getAssetConfig } from '@fireblocks/asset-config';
import { SigningWallet } from '../lib/wallets/SigningWallet';
import { ECDSAWallet } from '@fireblocks/wallet-derivation/wallets/ECDSAWallet';
import { EdDSAWallet, sha512 } from '@fireblocks/wallet-derivation/wallets/EdDSAWallet';
import DerivationPathInput from '@fireblocks/recovery-shared/components/DerivationPathInput';
import { Button, getDerivationMapKey, getLogger, Select, TextField } from '@fireblocks/recovery-shared';
import { Box, Checkbox, FormControlLabel, FormGroup, Grid, SelectChangeEvent, Typography } from '@mui/material';

const logger = getLogger('utility');

type SigningWalletWithSign = SigningWallet & {
  sign?: (message: Uint8Array, hasher?: (...msgs: Uint8Array[]) => Promise<Uint8Array>) => Promise<any>;
};

class DerivationPathECDSAWallet extends ECDSAWallet {
  protected getAddress(evmAddress?: string): string {
    return evmAddress || '';
  }
  async signMessage(message: string | Uint8Array, hasher = keccak256) {
    return await this.sign(message, hasher);
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

enum RawSignMethod {
  ACCOUNT = 'account',
  DERIVATION_PATH = 'derivationPath',
}

enum SigningAlgorithms {
  ECDSA = 'ecdsa',
  EDDSA = 'eddsa',
}

const RawSigning: React.FC = () => {
  const { extendedKeys, accounts } = useWorkspace();
  const accountsArray = useMemo(() => Array.from(accounts.values()), [accounts]);

  const [rawSignMethod, setRawSignMethod] = useState<RawSignMethod>(RawSignMethod.ACCOUNT);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<SigningWalletWithSign | null>(null);

  const [derivationPath, setDerivationPath] = useState<HDPath>({ coinType: 0, account: 0, changeIndex: 0, addressIndex: 0 });
  const [dpAlgorithm, setDpAlgorithm] = useState<SigningAlgorithms>(SigningAlgorithms.ECDSA);

  const [unsignedTx, setUnignedTx] = useState<string | null>(null);
  const [signedTx, setSignedTx] = useState<string | null>(null);

  const handleRawSigningMethod = (method: RawSignMethod) => {
    setRawSignMethod(method);
  };

  const walletOptions = useMemo(() => {
    if (selectedAccountId === null) return [];

    const selectedAccount = accountsArray.find((acc) => acc.id === selectedAccountId);
    const currentWallets = selectedAccount?.wallets;

    return currentWallets
      ? Array.from(currentWallets).map(([walletId, wallet]) => ({
          value: walletId,
          children: wallet.assetId,
        }))
      : [];
  }, [selectedAccountId, accountsArray]);

  const handleWalletChange = (event: SelectChangeEvent<unknown>) => {
    setSignedTx(null);
    const walletId = event.target.value as string;

    const selectedAccount = accountsArray.find((acc) => acc.id === selectedAccountId);
    const wallet = selectedAccount?.wallets.get(walletId) || null;
    if (!wallet) return;
    const assetId = wallet.assetId;
    const selectedAsset = getAssetConfig(assetId);
    if (!selectedAsset) return;
    const firstEntry = Array.from(wallet.derivations.values()).find((entry: any) => entry.address);
    const address = firstEntry?.address;
    if (!address) return;
    wallet;
    const derivationMapKey = getDerivationMapKey(selectedAsset.id, address);
    const derivation = wallet.derivations.get(derivationMapKey);
    if (!derivation) return;

    setSelectedWallet(derivation);
  };

  const formatECDSASignature = (signatureHex: string) => {
    const sigBytes = getBytes(signatureHex);

    const r = sigBytes.slice(0, 32);
    const s = sigBytes.slice(32, 64);
    const v = sigBytes[64];

    const rHex = Buffer.from(r).toString('hex');
    const sHex = Buffer.from(s).toString('hex');

    return {
      signature: signatureHex,
      r: rHex,
      s: sHex,
      v: v,
    };
  };

  const signTx = useCallback(async () => {
    try {
      // const solUnsignedTx = 'ef45bc8da9622b709f4a3cdcc4d09ffb7e8fc2b7c3a9b87a17f0c0b7d8967e4d';

      // const bitcoinUnsignedTx = '0e3e2357e806b6cdb1f70b54c3a3a8e60d1f085437ff66e2c4e5a42c0a5f4f3c';

      if (!unsignedTx) {
        throw new Error('transaction was not provided');
      }
      const txHashBuffer = Buffer.from(unsignedTx, 'hex');

      const message = Uint8Array.from(txHashBuffer);
      if (rawSignMethod === RawSignMethod.ACCOUNT) {
        if (!selectedWallet) return;

        if (!selectedWallet.sign) return;

        const sigHex = await selectedWallet.sign(message);

        const walletAlgorithm = selectedWallet.algorithm;

        switch (walletAlgorithm) {
          case 'EDDSA':
            const signatureString = Buffer.from(sigHex).toString('hex');
            console.log(signatureString);
            setSignedTx(signatureString || 'error');

            break;
          case 'ECDSA':
            const formattedSig = formatECDSASignature(sigHex);

            setSignedTx(JSON.stringify(formattedSig));
            break;
          default:
            logger.error('unkown wallet algorithm');
            break;
        }
      } else if (rawSignMethod === RawSignMethod.DERIVATION_PATH) {
        // const bitcoinHDPath = {
        //   coinType: 0,
        //   account: 0,
        //   changeIndex: 0,
        //   addressIndex: 0,
        // };

        // const solanaHDPath = {
        //   coinType: 501,
        //   account: 0,
        //   changeIndex: 0,
        //   addressIndex: 0,
        // };
        if (!extendedKeys?.xprv || !extendedKeys?.fprv || !extendedKeys?.xpub || !extendedKeys?.fpub) return;

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

            setSignedTx(JSON.stringify(formattedSig));
            break;
          case SigningAlgorithms.EDDSA:
            const dpEDDSAWallet = new DerivationPathEDDSAWallet(dpParams, derivationPath.coinType);
            const eddsaSigHex = await dpEDDSAWallet.signMessage(message);
            const signatureString = Buffer.from(eddsaSigHex).toString('hex');
            console.log(signatureString);
            setSignedTx(signatureString || 'error');

            break;
          default:
            logger.error('Derivation path algorithm error');
            break;
        }
      }
    } catch (error) {
      logger.error(`sign tx error ${error}`);
    }
  }, [unsignedTx, rawSignMethod, selectedWallet, extendedKeys, derivationPath, dpAlgorithm]);

  return (
    <>
      <Box component='form' height='100%' display='flex' flexDirection='column' onSubmit={() => {}}>
        <Typography variant='h1' component='h2' gutterBottom>
          Raw Signing
        </Typography>
        <Typography variant='body1' paragraph>
          Use this tool to sign transaction hashes with your Fireblocks keys by selecting assets either from your accounts or by
          specifying a custom derivation path. This secure signing process allows you to create cryptographic signatures for
          blockchain transactions without exposing your private keys.
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
              value={selectedWallet?.assetId ?? ''}
              onChange={handleWalletChange}
              items={walletOptions}
              sx={{ flex: 1 }}
              disabled={rawSignMethod !== RawSignMethod.ACCOUNT || selectedAccountId === null}
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
            label='Add Hashed Transaction'
            onChange={(e) => {
              setUnignedTx(e.target.value);
            }}
            sx={{ ml: 2, mr: 4 }}
          />
        </FormGroup>

        <Button
          sx={{ width: 'fit-content', mt: 2 }}
          color='primary'
          disabled={rawSignMethod === RawSignMethod.ACCOUNT ? !selectedWallet : false}
          onClick={signTx}
        >
          {'Sign Tx'}
        </Button>

        {signedTx &&
          ((rawSignMethod === RawSignMethod.ACCOUNT && selectedWallet?.algorithm === 'ECDSA') ||
          (rawSignMethod === RawSignMethod.DERIVATION_PATH && dpAlgorithm === SigningAlgorithms.ECDSA) ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant='h6'>ECDSA Signature Components:</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  Full Signature:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    width: '100%',
                    padding: 1,
                    borderRadius: 1,
                  }}
                >
                  {JSON.parse(signedTx).signature}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  r:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    padding: 1,
                    borderRadius: 1,
                  }}
                >
                  {JSON.parse(signedTx).r}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  s:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    padding: 1,
                    borderRadius: 1,
                  }}
                >
                  {JSON.parse(signedTx).s}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  v:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    padding: 1,
                    borderRadius: 1,
                  }}
                >
                  {JSON.parse(signedTx).v}
                </Typography>
              </Grid>
            </Grid>
          ) : (rawSignMethod === RawSignMethod.ACCOUNT && selectedWallet?.algorithm === 'EDDSA') ||
            (rawSignMethod === RawSignMethod.DERIVATION_PATH && dpAlgorithm === SigningAlgorithms.EDDSA) ? (
            <Typography
              variant='body1'
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
              }}
              paragraph
            >
              {signedTx}
            </Typography>
          ) : null)}
      </Box>
    </>
  );
};

export default RawSigning;
