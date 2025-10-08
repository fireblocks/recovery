import { ReactNode } from 'react';
import { Typography, Box, Link, Tooltip } from '@mui/material';
import {
  AssetIcon,
  BaseModal,
  RelayRequestParams,
  RelayRxTx,
  RelaySignTxResponseParams,
  getLogger,
  useWrappedState,
  getDerivationMapKey,
  RelayBroadcastTxRequestParams,
} from '@fireblocks/recovery-shared';
import { getDerivableAssetConfig } from '@fireblocks/asset-config';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';
import { sanatize } from '@fireblocks/recovery-shared/lib/sanatize';
import { getAssetConfig, isTransferableToken } from '@fireblocks/asset-config/util';
import { SignOrBroadcastTransaction } from '@fireblocks/recovery-shared/components';
import { useWorkspace } from '../../context/Workspace';
import { CreateTransaction, getAssetURLAndApiKey } from './CreateTransaction';
import { LateInitConnectedWallet } from '../../lib/wallets/LateInitConnectedWallet';
import { useSettings } from '../../context/Settings';
import { ERC20 } from '../../lib/wallets/ERC20';

const logger = getLogger(LOGGER_NAME_RELAY);

const getAssetId = (inboundRelayParams?: RelayRequestParams) => {
  let assetId: string;

  logger.debug(`Trying to get asset Id for ${JSON.stringify(inboundRelayParams, null, 2)}`);
  switch (inboundRelayParams?.action) {
    case 'tx/create':
      assetId = inboundRelayParams.newTx.assetId;
      break;
    case 'tx/broadcast':
      assetId = inboundRelayParams.signedTx.assetId;
      break;
    default:
      logger.warn(`Unknown action: ${inboundRelayParams?.action}`);
      return undefined;
  }

  return getDerivableAssetConfig(assetId)?.id;
};

export const WithdrawModal = () => {
  const { accounts, inboundRelayParams, getOutboundRelayUrl, setInboundRelayUrl, resetInboundRelayUrl } = useWorkspace();
  const { RPCs } = useSettings();

  const action = inboundRelayParams?.action;

  const relayAssetId = getAssetId(inboundRelayParams);
  const asset = getDerivableAssetConfig(relayAssetId);

  const [outboundRelayUrl, setOutboundRelayUrl] = useWrappedState<string | undefined>('outboundRelayUrl', undefined);
  const [txHash, setTxHash] = useWrappedState<string | undefined>('txHash', undefined);
  const [txBroadcastError, setTxBroadcastError] = useWrappedState<string | undefined>('txBroadcastError', undefined);

  const setSignTxResponseUrl = (unsignedTx: RelaySignTxResponseParams['unsignedTx']) => {
    logger.debug(
      `Setting sign tx request: ${JSON.stringify(
        unsignedTx,
        // eslint-disable-next-line no-nested-ternary
        (_, v) => (typeof v === 'bigint' ? v.toString() : typeof v === 'function' ? 'function' : v),
        2,
      )}`,
    );
    setOutboundRelayUrl(
      getOutboundRelayUrl({
        action: 'tx/sign',
        accountId: inboundRelayParams?.accountId as number,
        unsignedTx,
      }),
    );
  };

  const broadcastTransaction = async () => {
    if (!inboundRelayParams) {
      throw new Error("No inbound relay parameters, can't proceed.");
    }
    const params = inboundRelayParams as RelayBroadcastTxRequestParams;
    logger.info('Inbound parameters:', { inboundRelayParams });
    const { assetId } = params.signedTx;
    const wallet = accounts.get(params.accountId)?.wallets.get(assetId);

    const derivation = wallet?.derivations?.get(getDerivationMapKey(assetId, params.signedTx.from));
    if (isTransferableToken(assetId) && derivation instanceof ERC20) {
      (derivation as ERC20).setNativeAsset(getAssetConfig(assetId)!.nativeAsset);
    }
    const data = getAssetURLAndApiKey(derivation?.assetId ?? '', RPCs);
    if (!data) {
      throw new Error(`No RPC data for: ${derivation?.assetId}`);
    }
    const { url: rpcUrl, requiresApiKey, apiKey } = data;
    if (rpcUrl === undefined) {
      throw new Error(`No RPC URL for asset ${derivation?.assetId}`);
    } else if (rpcUrl === null) {
      if (derivation?.isLateInit()) {
        (derivation as LateInitConnectedWallet).updateDataEndpoint(params.endpoint!);
      }
    } else {
      derivation?.setRPCUrl(rpcUrl);
    }

    if (requiresApiKey) {
      if (!apiKey || apiKey === '') {
        throw new Error(`RPC for ${derivation?.assetId} requires an API key`);
      } else {
        derivation!.setAPIKey(apiKey);
      }
    }

    const signedTxHex = params.signedTx.hex;

    const cleanDerivation = derivation ? sanatize(derivation) : undefined;
    logger.info('Derivation and signed transaction hash:', { cleanDerivation, signedTxHex });
    try {
      const newTxHash = await derivation?.broadcastTx(signedTxHex, logger, derivation?.assetId);

      setTxHash(newTxHash);
      logger.info({ newTxHash });
    } catch (e) {
      setTxBroadcastError((e as Error).message);
    }
  };

  const onDecodeInboundRelayQrCode = (url: string) => {
    if (url) setInboundRelayUrl(url);
  };

  logger.info('Outbound URL', { outboundRelayUrl });

  return (
    <BaseModal
      open={!!action?.startsWith('tx') && !!asset}
      onClose={() => resetInboundRelayUrl()}
      title={
        (
          <Typography variant='h1' display='flex' alignItems='center'>
            <Box display='flex' alignItems='center' marginRight='0.5rem'>
              <AssetIcon assetId={asset?.id} />
            </Box>
            Withdraw {asset?.name || 'Asset'}
          </Typography>
        ) as ReactNode
      }
    >
      {asset && inboundRelayParams ? (
        <>
          {action === 'tx/create' &&
            (outboundRelayUrl ? (
              <>
                <Typography variant='body1' paragraph>
                  Scan the QR code with Recovery Utility to sign a transaction. Then scan the resulting QR code from Recovery
                  Utility to broadcast the transaction.
                </Typography>
                <RelayRxTx
                  rxTitle='Signed transaction'
                  txTitle='Transaction parameters'
                  txUrl={outboundRelayUrl}
                  onDecodeQrCode={onDecodeInboundRelayQrCode}
                />
              </>
            ) : (
              <CreateTransaction
                asset={asset}
                inboundRelayParams={inboundRelayParams}
                setSignTxResponseUrl={setSignTxResponseUrl}
              />
            ))}
          {action === 'tx/broadcast' && (
            <>
              <Box display='flex' justifyContent='center' alignItems='center' flexDirection='column'>
                <SignOrBroadcastTransaction
                  account={accounts.get(inboundRelayParams.accountId)!}
                  asset={asset!}
                  inboundRelayParams={inboundRelayParams}
                  broadcastTransaction={broadcastTransaction}
                  broadcastHidden={txHash !== undefined || txBroadcastError !== undefined}
                />
              </Box>
              {!!txBroadcastError && (
                <Box height='100%' display='flex' flexDirection='column' borderRadius='6px' padding='8px 8px 0 8px'>
                  <Typography variant='body1' textAlign='center' fontWeight='600' color={(theme) => theme.palette.error.main}>
                    Transaction broadcast failed due to: {txBroadcastError}
                  </Typography>
                </Box>
              )}
              {!!txHash && (
                <Box
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  textAlign='center'
                >
                  {asset.getExplorerUrl ? (
                    <Link href={asset.getExplorerUrl!('tx')(txHash)} target='_blank' rel='noopener noreferrer'>
                      <Typography variant='body1'>Transaction Hash</Typography>
                    </Link>
                  ) : (
                    <Tooltip title={txHash}>
                      <Typography variant='body1'>{txHash}</Typography>
                    </Tooltip>
                  )}
                  <Typography variant='body1'>
                    The transaction might take a few seconds to appear on the block explorer
                  </Typography>
                </Box>
              )}
              {!!txBroadcastError && (
                <Typography variant='body1' fontWeight='600' color={(theme) => theme.palette.error.main}>
                  Tx broadcast failed:
                  <br />
                  {txBroadcastError}
                </Typography>
              )}
            </>
          )}
        </>
      ) : (
        <Typography variant='body1'>Asset {relayAssetId} not found in your vault</Typography>
      )}
    </BaseModal>
  );
};
