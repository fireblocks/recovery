import { ReactNode, useState } from 'react';
import { Typography, Box, Link } from '@mui/material';
import {
  AssetIcon,
  BaseModal,
  Button,
  RelayRequestParams,
  RelayRxTx,
  RelaySignTxResponseParams,
} from '@fireblocks/recovery-shared';
import { getDerivableAssetConfig } from '@fireblocks/asset-config';
import { useWorkspace } from '../../context/Workspace';
import { CreateTransaction } from './CreateTransaction';
import { LateInitConnectedWallet } from '../../lib/wallets/LateInitConnectedWallet';

const getAssetId = (inboundRelayParams?: RelayRequestParams) => {
  let assetId: string;

  switch (inboundRelayParams?.action) {
    case 'tx/create':
      assetId = inboundRelayParams.newTx.assetId;
      break;
    case 'tx/broadcast':
      assetId = inboundRelayParams.signedTx.assetId;
      break;
    default:
      return undefined;
  }

  return getDerivableAssetConfig(assetId)?.id;
};

export const WithdrawModal = () => {
  const { accounts, inboundRelayParams, getOutboundRelayUrl, setInboundRelayUrl, setTransaction } = useWorkspace();

  const action = inboundRelayParams?.action;

  const relayAssetId = getAssetId(inboundRelayParams);
  const asset = getDerivableAssetConfig(relayAssetId);

  const [outboundRelayUrl, setOutboundRelayUrl] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();

  const setSignTxResponseUrl = (unsignedTx: RelaySignTxResponseParams['unsignedTx']) => {
    console.info('setSignTxResponseUrl', { unsignedTx });

    setOutboundRelayUrl(
      getOutboundRelayUrl({
        action: 'tx/sign',
        accountId: inboundRelayParams?.accountId as number,
        unsignedTx,
      }),
    );
  };

  const onDecodeInboundRelayQrCode = (url: string) => {
    setInboundRelayUrl(url);
  };

  console.info({ outboundRelayUrl });

  return (
    <BaseModal
      open={!!action?.startsWith('tx') && !!asset}
      onClose={() => setInboundRelayUrl(null)}
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
                <Button
                  onClick={async () => {
                    console.info({ inboundRelayParams });

                    const wallet = accounts.get(inboundRelayParams?.accountId)?.wallets.get(inboundRelayParams?.signedTx.assetId);

                    const derivation = wallet?.derivations?.get(inboundRelayParams?.signedTx.from);

                    if (derivation?.isLateInit()) {
                      (derivation as LateInitConnectedWallet).updateDataEndpoint(inboundRelayParams.endpoint!);
                    }

                    const signedTxHex = inboundRelayParams?.signedTx.hex;

                    console.info({ derivation, signedTxHex });

                    const newTxHash = await derivation?.broadcastTx(signedTxHex);

                    setTxHash(newTxHash);

                    console.info({ newTxHash });
                  }}
                >
                  Confirm and broadcast
                </Button>
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
                  <Link href={`https://etherscan.io/tx/${txHash}`} target='_blank' rel='noopener noreferrer'>
                    {txHash}
                  </Link>
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
