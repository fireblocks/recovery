import { useMemo, ReactNode, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Typography, Box } from '@mui/material';
import {
  VaultAccount,
  BaseModal,
  AssetIcon,
  TransactionInitInput,
  RelayRxTx,
  getLogger,
  useWrappedState,
} from '@fireblocks/recovery-shared';
import { getAssetConfig, derivableAssets, AssetConfig, getDerivableAssetConfig } from '@fireblocks/asset-config';
import { useWorkspace } from '../../../context/Workspace';
import { InitiateTransaction } from './InitiateTransaction';
import { SignTransaction } from './SignTransaction';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';

type Props = {
  assetId?: string;
  accountId?: number;
  open: boolean;
  onClose: VoidFunction;
};

const logger = getLogger(LOGGER_NAME_UTILITY);

const getDerivableAssetId = (assetId?: string) => {
  logger.info(`Trying to get asset config for ${assetId}`);
  return getDerivableAssetConfig(assetId)?.id;
};

const getHighestBalanceAssetId = (account?: VaultAccount) => {
  if (!account?.wallets.size) {
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
  const {
    accounts,
    inboundRelayParams,
    getOutboundRelayUrl,
    resetInboundRelayUrl,
    setInboundRelayUrl,
    getExtendedKeysForAccountId,
  } = useWorkspace();

  const accountsArray = useMemo(() => Array.from(accounts.values()), [accounts]);

  const assetsInAccount = useMemo(
    () => derivableAssets.filter((asset) => accountsArray.some((account) => account.wallets.has(asset.id))),
    [accountsArray],
  );

  const [txInitData, setTxInitData] = useWrappedState<TransactionInitInput | null>('txInitData', null);

  const [createTxOutboundRelayUrl, setCreateTxOutboundRelayUrl] = useWrappedState<string | null>(
    'createTxOutboundRelayUrl',
    null,
  );

  const selectedAccount = typeof accountId === 'number' ? accounts.get(accountId) : undefined;

  const selectedAsset = getAssetConfig(txInitData?.assetId);

  const [newTxId, setNewTxId] = useWrappedState('newTxId', nanoid);

  const onClose = () => {
    logger.info(`Closing withdrawal modal`);
    onCloseModal();
    resetInboundRelayUrl();
    setNewTxId(nanoid());
  };

  const onInitiateTransaction = (data: TransactionInitInput) => {
    const { xpub, fpub } = getExtendedKeysForAccountId(data.accountId) || {};

    if (!xpub || !fpub || typeof data.accountId !== 'number' || typeof data.assetId !== 'string' || typeof data.to !== 'string') {
      logger.warn(
        'Missing x-pub-keys, account id, asset id or destination value',
        'accountId',
        data.accountId,
        'assetId',
        data.assetId,
        'to',
        data.to,
      );
      return;
    }

    logger.info('Creating outbound relay url');
    const createTxUrl = getOutboundRelayUrl({
      action: 'tx/create',
      accountId: data.accountId,
      newTx: {
        id: newTxId,
        assetId: data.assetId,
        to: data.to,
      },
    });

    setTxInitData(data);

    setCreateTxOutboundRelayUrl(createTxUrl);
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
      {inboundRelayParams?.action === 'tx/sign' && !!selectedAccount && !!selectedAsset && (
        <SignTransaction txId={newTxId} account={selectedAccount} asset={selectedAsset} inboundRelayParams={inboundRelayParams} />
      )}
      {!!createTxOutboundRelayUrl && !!txInitData && inboundRelayParams?.action !== 'tx/sign' && (
        <>
          <Typography variant='body1' paragraph>
            Scan the QR code with an online device to create a transaction with Recovery Relay. Pass QR codes back and forth to
            sign the transaction with Recovery Utility and broadcast it with Recovery Relay. This does not expose your private
            keys.
          </Typography>
          <RelayRxTx
            rxTitle='Transaction parameters'
            txTitle={`xpub/fpub, account ${txInitData.accountId}, asset ${txInitData.assetId}`}
            txUrl={createTxOutboundRelayUrl}
            onDecodeQrCode={(data) => {
              if (!setInboundRelayUrl(data)) {
                return;
              }
              setCreateTxOutboundRelayUrl(null);
            }}
          />
        </>
      )}
      {!txInitData && (
        <InitiateTransaction
          accountsArray={accountsArray}
          assetsInAccount={assetsInAccount as unknown as AssetConfig[]}
          initialAccountId={accountId}
          initialAssetId={assetId ? getDerivableAssetId(assetId) : getHighestBalanceAssetId(selectedAccount)}
          onSubmit={onInitiateTransaction}
        />
      )}
    </BaseModal>
  );
};
