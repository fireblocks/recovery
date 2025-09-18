/* eslint-disable no-nested-ternary */
import { ReactNode } from 'react';
import { Typography, Box } from '@mui/material';
import {
  VaultAccount,
  RelayRxTx,
  RelaySignTxResponseParams,
  getLogger,
  sanatize,
  useWrappedState,
  getDerivationMapKey,
} from '@fireblocks/recovery-shared';
import { AssetConfig } from '@fireblocks/asset-config';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';
import { SignOrBroadcastTransaction } from '@fireblocks/recovery-shared/components';
import { useWorkspace } from '../../../../context/Workspace';
import { SigningWallet } from '../../../../lib/wallets/SigningWallet';
import {
  StdUTXO,
  BaseUTXOType,
  SegwitUTXOType,
  BTCSegwitUTXO,
  BTCLegacyUTXO,
  GenerateTxInput,
} from '../../../../lib/wallets/types';

const BlockedMessage = ({ children }: { children: ReactNode }) => (
  <Box>
    <Typography color='error' variant='body1'>
      {children} This could be a phishing attempt. Transaction signing blocked.
    </Typography>
  </Box>
);

type Props = {
  txId: string;
  account: VaultAccount;
  asset: AssetConfig;
  inboundRelayParams: RelaySignTxResponseParams;
};

const logger = getLogger(LOGGER_NAME_UTILITY);

export const SignTransaction = ({ txId, account, asset, inboundRelayParams }: Props) => {
  logger.info('Inbound relay params', inboundRelayParams);

  const { unsignedTx } = inboundRelayParams;

  const { getOutboundRelayUrl, getExtendedKeysForAccountId } = useWorkspace();

  const [outboundRelayUrl, setOutboundRelayUrl] = useWrappedState<string | undefined>('outboundRelayUrl', undefined);

  const onApproveTransaction = async () => {
    try {
      logger.info(`Trying to approve transaction.`);

      const { xprv, fprv } = getExtendedKeysForAccountId(account.id)!;

      if (!xprv || !fprv) {
        return;
      }

      const { to, amount, misc } = unsignedTx;

      const derivation = account.wallets
        .get(asset.id)
        ?.derivations.get(getDerivationMapKey(inboundRelayParams?.unsignedTx.assetId, inboundRelayParams?.unsignedTx.from));

      if (!derivation) {
        throw new Error('Derivation not found');
      }

      const sanatizedDerivation = sanatize(derivation);
      logger.debug(`About to sign tx to ${to}`, { sanatizedDerivation });

      const utxos = misc
        ? misc?.utxoType === BaseUTXOType
          ? (misc?.utxos as StdUTXO[])
          : misc?.utxoType === SegwitUTXOType
          ? (misc?.utxos as BTCSegwitUTXO[])
          : (misc?.utxos as BTCLegacyUTXO[])
        : undefined;

      const { tx } = await (derivation as SigningWallet).generateTx({
        to,
        amount,
        utxos, // TODO: Fix type
        feeRate: misc?.feeRate,
        nonce: misc?.nonce,
        gasPrice: misc?.gasPrice,
        memo: misc?.memo,
        // blockHash: misc?.blockHash,
        extraParams: misc?.extraParams,
        chainId: misc?.chainId,
      } as GenerateTxInput);

      logger.info({ tx });

      setOutboundRelayUrl(
        getOutboundRelayUrl({
          action: 'tx/broadcast',
          accountId: account.id,
          signedTx: {
            id: unsignedTx.id,
            assetId: unsignedTx.assetId,
            path: unsignedTx.path,
            from: unsignedTx.from,
            to: unsignedTx.to,
            amount: unsignedTx.amount,
            hex: tx,
          },
          endpoint: misc?.endpoint,
        }),
      );
    } catch (error) {
      logger.error('Failed to approve transaction', error);
    }
  };

  if (inboundRelayParams.accountId !== account.id || unsignedTx.path[2] !== account.id) {
    return <BlockedMessage>Unexpected account ID from Recovery Relay.</BlockedMessage>;
  }

  if (unsignedTx.assetId !== asset.id) {
    return <BlockedMessage>Unexpected asset ID from Recovery Relay.</BlockedMessage>;
  }

  if (unsignedTx.id !== txId) {
    return <BlockedMessage>Unexpected transaction ID from Recovery Relay.</BlockedMessage>;
  }

  return outboundRelayUrl ? (
    <RelayRxTx txTitle='Signed transaction' txUrl={outboundRelayUrl} />
  ) : (
    <SignOrBroadcastTransaction
      account={account}
      asset={asset}
      onApproveTransaction={onApproveTransaction}
      inboundRelayParams={inboundRelayParams}
    />
  );
};
