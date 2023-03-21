import { useMemo, useState, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { Typography, Box } from '@mui/material';
import { VaultAccount, BaseModal, AssetIcon } from '@fireblocks/recovery-shared';
import { getAssetConfig, derivableAssets, AssetConfig, getDerivableAssetConfig } from '@fireblocks/asset-config';
import { useWorkspace } from '../../../context/Workspace';
import { InitiateTransaction } from './InitiateTransaction';
import { SignTransaction } from './SignTransaction';

type Props = {
  assetId?: string;
  accountId: number;
  open: boolean;
  onClose: VoidFunction;
};

const getDerivableAssetId = (assetId?: string) => getDerivableAssetConfig(assetId)?.id;

const getHighestBalanceAssetId = (account: VaultAccount) => {
  if (!account.wallets.size) {
    return undefined;
  }

  const assets = Array.from(account.wallets.values());

  const maxBalanceWallet = assets.reduce(
    (max, asset) =>
      typeof asset.balance?.native !== 'undefined' &&
      typeof max?.balance?.native !== 'undefined' &&
      asset.balance.native > max.balance.native
        ? asset
        : max,
    assets[0],
  );

  const assetId = maxBalanceWallet?.assetId;

  const derivableAssetId = getDerivableAssetId(assetId);

  return derivableAssetId;
};

export const WithdrawModal = ({ assetId, accountId, open, onClose: onCloseModal }: Props) => {
  const { accounts, inboundRelayParams, setInboundRelayUrl } = useWorkspace();

  const accountsArray = useMemo(() => Array.from(accounts.values()), [accounts]);

  const assetsInAccount = useMemo(
    () => derivableAssets.filter((asset) => accountsArray.some((account) => account.wallets.has(asset.id))),
    [accountsArray],
  );

  const [selectedAccount, setSelectedAccount] = useState<VaultAccount | undefined>(accounts.get(accountId) ?? accountsArray[0]);

  const onChangeAccount = (newAccount?: VaultAccount) => setSelectedAccount(newAccount);

  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(() =>
    assetId ? getDerivableAssetId(assetId) : getHighestBalanceAssetId(selectedAccount ?? accountsArray[0]),
  );

  const selectedAsset = getAssetConfig(selectedAssetId);

  const onChangeAssetId = (newAssetId?: string) => setSelectedAssetId(newAssetId);

  const [newTxId, setNewTxId] = useState(nanoid);

  const onClose = () => {
    onCloseModal();
    setInboundRelayUrl(null);
    setNewTxId(nanoid());
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={
        (
          <Typography variant='h1' display='flex' alignItems='center'>
            <Box display='flex' alignItems='center' marginRight='0.5rem'>
              <AssetIcon assetId={selectedAsset?.id} />
            </Box>
            Withdraw {selectedAsset?.name || ''}
          </Typography>
        ) as ReactNode
      }
    >
      {inboundRelayParams?.action === 'tx/sign' && selectedAccount && selectedAsset ? (
        <SignTransaction txId={newTxId} account={selectedAccount} asset={selectedAsset} inboundRelayParams={inboundRelayParams} />
      ) : (
        <InitiateTransaction
          txId={newTxId}
          accountsArray={accountsArray}
          assetsInAccount={assetsInAccount as unknown as AssetConfig[]}
          account={selectedAccount}
          asset={selectedAsset}
          onChangeAccount={onChangeAccount}
          onChangeAssetId={onChangeAssetId}
        />
      )}
    </BaseModal>
  );
};
