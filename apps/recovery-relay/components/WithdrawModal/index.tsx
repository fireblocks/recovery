import { ReactNode, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { AssetIcon, BaseModal, RelayRequestParams, RelayRxTx, RelaySignTxResponseParams } from '@fireblocks/recovery-shared';
import { getDerivableAssetConfig } from '@fireblocks/asset-config';
import { useWorkspace } from '../../context/Workspace';
import { CreateTransaction } from './CreateTransaction';

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
  const { inboundRelayParams, getOutboundRelayUrl, setInboundRelayUrl, setTransaction } = useWorkspace();

  const action = inboundRelayParams?.action;

  const relayAssetId = getAssetId(inboundRelayParams);
  const asset = getDerivableAssetConfig(relayAssetId);

  const [outboundRelayUrl, setOutboundRelayUrl] = useState<string | undefined>();

  const setSignTxResponseUrl = (unsignedTx: RelaySignTxResponseParams['unsignedTx']) =>
    setOutboundRelayUrl(
      getOutboundRelayUrl({
        action: 'tx/sign',
        accountId: inboundRelayParams?.accountId as number,
        unsignedTx,
      }),
    );

  const onDecodeInboundRelayQrCode = (url: string) => {
    setInboundRelayUrl(url);
  };

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
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>WIP: Confirm and broadcast</pre>
          )}
        </>
      ) : (
        <Typography variant='body1'>Asset {relayAssetId} not found in your vault</Typography>
      )}
    </BaseModal>
  );
};
