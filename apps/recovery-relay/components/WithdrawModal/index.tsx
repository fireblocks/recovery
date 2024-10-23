import { ReactNode } from 'react';
import { Typography, Box, Link } from '@mui/material';
import {
  AssetIcon,
  BaseModal,
  Button,
  RelayRequestParams,
  RelayRxTx,
  RelaySignTxResponseParams,
  getLogger,
  useWrappedState,
} from '@fireblocks/recovery-shared';
import { getDerivableAssetConfig } from '@fireblocks/asset-config';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';
import { sanatize } from '@fireblocks/recovery-shared/lib/sanatize';
import { useWorkspace } from '../../context/Workspace';
import { CreateTransaction, getAssetURL } from './CreateTransaction';
import { LateInitConnectedWallet } from '../../lib/wallets/LateInitConnectedWallet';
import { useSettings } from '../../context/Settings';

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
            <Box display='flex' alignItems='center' justifyContent='center' flexDirection='column'>
              {!txHash && (
                <>
                  <Button
                    disabled={process.env.CI === 'e2e' ? false : txBroadcastError !== undefined}
                    onClick={async () => {
                      logger.info('Inbound parameters:', { inboundRelayParams });

                      const wallet = accounts
                        .get(inboundRelayParams?.accountId)
                        ?.wallets.get(inboundRelayParams?.signedTx.assetId);

                      const derivation = wallet?.derivations?.get(inboundRelayParams?.signedTx.from);

                      const rpcUrl = getAssetURL(derivation?.assetId ?? '', RPCs);
                      if (rpcUrl === undefined) {
                        throw new Error(`No RPC URL for asset ${derivation?.assetId}`);
                      } else if (rpcUrl === null) {
                        if (derivation?.isLateInit()) {
                          (derivation as LateInitConnectedWallet).updateDataEndpoint(inboundRelayParams.endpoint!);
                        }
                      } else {
                        derivation?.setRPCUrl(rpcUrl);
                      }

                      const signedTxHex = inboundRelayParams?.signedTx.hex;

                      const cleanDerivation = derivation ? sanatize(derivation) : undefined;
                      logger.info('Derivation and signed transaction hash:', { cleanDerivation, signedTxHex });
                      try {
                        const newTxHash = await derivation?.broadcastTx(signedTxHex);

                        setTxHash(newTxHash);
                        logger.info({ newTxHash });
                      } catch (e) {
                        setTxBroadcastError((e as Error).message);
                      }
                    }}
                  >
                    Confirm and broadcast
                  </Button>
                  {!!txBroadcastError && (
                    <Box height='100%' display='flex' flexDirection='column' borderRadius='6px' padding='8px 8px 0 8px'>
                      <Typography variant='body1' textAlign='center' fontWeight='600' color={(theme) => theme.palette.error.main}>
                        Transaction broadcast failed due to: {txBroadcastError}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              {!!txHash && (
                <Typography
                  variant='body1'
                  paragraph
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    '& > *': {
                      marginRight: '0.5rem',
                    },
                  }}
                >
                  <Typography variant='body1'>Transaction hash:</Typography>
                  {asset.getExplorerUrl ? (
                    <Link href={asset.getExplorerUrl!('tx')(txHash)} target='_blank' rel='noopener noreferrer'>
                      {txHash}
                    </Link>
                  ) : (
                    txHash
                  )}
                </Typography>
              )}
              {!!txBroadcastError && (
                <Typography variant='body1' fontWeight='600' color={(theme) => theme.palette.error.main}>
                  Tx broadcast failed:
                  <br />
                  {txBroadcastError}
                </Typography>
              )}
            </Box>
          )}
        </>
      ) : (
        <Typography variant='body1'>Asset {relayAssetId} not found in your vault</Typography>
      )}
    </BaseModal>
  );
};
