import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Typography, Grid, InputLabel, CircularProgress, Autocomplete, TextField as MuiTextField } from '@mui/material';
import {
  Button,
  TextField,
  NextLinkComposed,
  monospaceFontFamily,
  VaultAccount,
  TransactionInput,
  transactionInput,
  RelayCreateTxRequestParams,
  RelaySignTxResponseParams,
  getLogger,
  sanatize,
  useOfflineQuery,
  getDerivationMapKey,
} from '@fireblocks/recovery-shared';
import { AssetConfig, getAssetConfig, isNativeAssetId } from '@fireblocks/asset-config';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';
import { useWorkspace } from '../../../context/Workspace';
import { Derivation, AccountData } from '../../../lib/wallets';
import { LateInitConnectedWallet } from '../../../lib/wallets/LateInitConnectedWallet';
import { useSettings } from '../../../context/Settings';
import { Jetton } from '../../../lib/wallets/Jetton';
import { ERC20 } from '../../../lib/wallets/ERC20';

const logger = getLogger(LOGGER_NAME_RELAY);

const getRPCKey = (
  assetId: string,
  RPCs: Record<
    string,
    {
      enabled: boolean;
      allowedEmptyValue: boolean;
      name: string;
      url?: string | null | undefined;
    }
  >,
): string | undefined => {
  if (assetId === '') {
    return undefined;
  }
  let baseAsset = assetId;
  if (!isNativeAssetId(baseAsset)) {
    const assetConfig = getAssetConfig(baseAsset);
    if (assetConfig === undefined) {
      logger.error(`Unknown asset: ${baseAsset}`);
      return undefined;
    }
    baseAsset = assetConfig.nativeAsset;
  }
  if (!Object.keys(RPCs).includes(baseAsset)) {
    logger.error(`Unknown base asset Id: ${baseAsset}`);
    return undefined;
  }
  return baseAsset;
};

export const getAssetURL = (
  assetId: string,
  RPCs: Record<
    string,
    {
      enabled: boolean;
      allowedEmptyValue: boolean;
      name: string;
      url?: string | null | undefined;
    }
  >,
): string | null | undefined => {
  const rpcKey = getRPCKey(assetId, RPCs);
  if (rpcKey === undefined) {
    return undefined;
  }

  const assetRPCData = RPCs[rpcKey];
  const { url } = assetRPCData;
  logger.info(`RPC URL for ${rpcKey} is ${assetRPCData.enabled ? 'enabled' : 'disabled'} and is ${url}`);

  if (assetRPCData.allowedEmptyValue && (url === null || url === undefined)) {
    return null;
  }
  if (!assetRPCData.enabled) {
    // If not enabled we shouldn't be getting a request to the relay for it regardless.
    return undefined;
  }
  return url;
};

const getWallet = (accounts: Map<number, VaultAccount<Derivation>>, accountId?: number, assetId?: string) => {
  if (typeof accountId === 'undefined' || typeof assetId === 'undefined') {
    return undefined;
  }

  logger.debug(`Getting a wallet ${accountId} for asset ${assetId}`);

  return accounts.get(accountId)?.wallets.get(assetId);
};

const sortDerivationsArrayByAddressIndex = (derivations?: Map<string, Derivation>) => {
  if (!derivations?.size) {
    return [];
  }

  const derivationsArray = Array.from(derivations.values());

  const sortedArray = derivationsArray.sort((a, b) => a.path.addressIndex - b.path.addressIndex);

  return sortedArray;
};

type Props = {
  asset: AssetConfig;
  inboundRelayParams: RelayCreateTxRequestParams;
  setSignTxResponseUrl: (txParams: RelaySignTxResponseParams['unsignedTx']) => void;
};

export const CreateTransaction = ({ asset, inboundRelayParams, setSignTxResponseUrl }: Props) => {
  const { accounts } = useWorkspace();
  const { saveSettings, RPCs } = useSettings();

  const { accountId } = inboundRelayParams;
  const { id: txId, to: toAddress } = inboundRelayParams.newTx;

  const wallet = getWallet(accounts, accountId, asset?.id);
  const derivationsArray = sortDerivationsArrayByAddressIndex(wallet?.derivations);
  const fromAddresses = derivationsArray.map((d) => d.address);

  const defaultValues: TransactionInput = {
    fromAddress: fromAddresses[0],
    memo: '',
    utxos: [],
    endpoint: undefined,
  };

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionInput),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const values = watch();

  const fromAddress = values.fromAddress ?? defaultValues.fromAddress;

  const derivation = wallet?.derivations?.get(getDerivationMapKey(asset?.id, fromAddress));

  // TODO: Show both original balance and adjusted balance in create tx UI

  const prepareQueryKey = ['prepare', fromAddress, values.memo];

  const prepareQuery = useOfflineQuery({
    queryKey: prepareQueryKey,
    enabled: !!derivation,
    queryFn: async () => {
      logger.debug(`Querying prepare transaction ${toAddress}`);
      const rpcUrl = getAssetURL(derivation?.assetId ?? '', RPCs);
      if (rpcUrl === undefined) {
        logger.error(`Unknown URL for ${derivation?.assetId ?? '<empty>'}`);
        throw new Error(`No RPC Url for: ${derivation?.assetId}`);
      }
      if (asset.address && asset.protocol === 'TON') {
        (derivation as Jetton).setTokenAddress(asset.address);
        (derivation as Jetton).setDecimals(asset.decimals);
      }
      if (asset.address && asset.protocol === 'ETH') {
        (derivation as ERC20).setTokenAddress(asset.address);
        (derivation as ERC20).setDecimals(asset.decimals);
        (derivation as ERC20).setToAddress(toAddress);
        (derivation as ERC20).setNativeAsset(asset.nativeAsset);
      }
      if (rpcUrl !== null) derivation!.setRPCUrl(rpcUrl); // this must remain the last method called on derivation for ERC20 support

      return await derivation!.prepare?.(toAddress, values.memo);
    },
    onSuccess: (prepare: AccountData) => {
      logger.info('UTXOs', prepare.utxos);

      // if (prepare.utxos) {
      //   setTransactionInput((prev) => ({ ...prev, utxos: [] }));
      // }
    },
    onError: (err: Error) => logger.error('Failed to prepare transaction parameters', err),
  });

  const isLoading = !!prepareQuery.isLoading; // || balanceQuery.isLoading

  const onSubmit = (data: TransactionInput) => {
    logger.debug(`Submitting the withdraw dialog ${data}.`);

    if (!asset?.id || !derivation) {
      console.error('No derivation found:', derivation);
      return;
    }

    if (typeof asset === 'undefined') {
      console.error('No asset defined');
      return;
    }

    const balance = prepareQuery.data?.balance;

    if (typeof balance === 'undefined') {
      console.error('No balance found for derivation', derivation);
      return;
    }

    const sortedUtxos = prepareQuery.data?.utxos?.sort((a, b) => b.value - a.value) ?? [];

    setSignTxResponseUrl({
      id: txId,
      assetId: asset.id,
      path: [44, derivation.path.coinType, derivation.path.account, derivation.path.changeIndex, derivation.path.addressIndex],
      from: data.fromAddress,
      to: toAddress,
      amount: balance,
      balance,
      misc: {
        nonce: prepareQuery.data?.nonce,
        gasPrice: `${prepareQuery.data?.gasPrice}`,
        feeRate: prepareQuery.data?.feeRate,
        extraParams: prepareQuery.data?.extraParams,
        memo: values.memo,
        chainId: prepareQuery.data?.chainId,
        endpoint: derivation.isLateInit() ? prepareQuery.data?.endpoint : undefined,
        // TODO: FIX UTXO TYPE
        // @ts-ignore
        utxos: sortedUtxos?.length ? sortedUtxos : undefined,
      },
      // memo: data.memo,
    });
  };

  const fromAddressId = useId();
  const balanceId = useId();
  const addressExplorerId = useId();

  logger.info('Parameters for CreateTransaction ', {
    txId,
    accountId,
    values,
    asset,
    derivation: sanatize(derivation),
    prepare: JSON.stringify(
      prepareQuery.data,
      (_, v) => (typeof v === 'bigint' ? v.toString() : typeof v === 'function' ? 'function' : v),
      2,
    ),
  });

  return (
    <Grid
      component='form'
      container
      spacing={1}
      alignItems='center'
      justifyContent='center'
      onSubmit={handleSubmit(onSubmit, console.error)}
    >
      <Grid item xs={12}>
        <InputLabel
          shrink
          htmlFor={fromAddressId}
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#000000',
            userSelect: 'text',
          }}
        >
          From Address
        </InputLabel>
        <input type='hidden' {...register('fromAddress')} />
        <Autocomplete
          id='fromAddress'
          autoComplete
          value={fromAddress ?? ''}
          options={fromAddresses}
          renderInput={(params) => (
            <MuiTextField
              {...params}
              fullWidth
              inputProps={{ ...params.inputProps, sx: { fontFamily: monospaceFontFamily, paddingY: '0.25rem' } }}
            />
          )}
          onChange={(_, newAddress) => setValue('fromAddress', newAddress ?? fromAddress)}
        />
      </Grid>
      <Grid item xs={12}>
        <InputLabel
          shrink
          htmlFor={balanceId}
          sx={{
            lineHeight: 'normal',
            fontSize: '18px',
            fontWeight: 600,
            color: '#000000',
          }}
        >
          Balance
        </InputLabel>
      </Grid>
      <Grid item flex='1'>
        {isLoading ? (
          <CircularProgress size='24px' />
        ) : (
          <Typography
            id={balanceId}
            noWrap
            fontFamily={prepareQuery.error ? undefined : monospaceFontFamily}
            sx={{ userSelect: 'text', cursor: 'default' }}
          >
            {prepareQuery.error || typeof prepareQuery.data?.balance === 'undefined'
              ? 'Could not get balance'
              : `${prepareQuery.data.balance} ${asset.id}`}
          </Typography>
        )}
      </Grid>
      {!!asset && 'getExplorerUrl' in asset && (
        <Grid item flex='1'>
          <Button
            id={addressExplorerId}
            variant='outlined'
            component={NextLinkComposed}
            to={asset.getExplorerUrl?.('address')(fromAddress ?? '')}
            target='_blank'
            rel='noopener noreferrer'
          >
            Open Explorer
          </Button>
        </Grid>
      )}
      <Grid item xs={12}>
        <Typography sx={{ marginTop: '16px' }} variant='body1' paragraph>
          The entire balance will be sent so that you can migrate to a new wallet.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          id='memo'
          label='Memo or Tag field (when applicable)'
          error={errors.memo?.message}
          disabled={isLoading}
          autoComplete='off'
          autoCapitalize='off'
          spellCheck={false}
          isMonospace
          {...register('memo')}
        />
      </Grid>
      {derivation && derivation.isLateInit() ? (
        <Grid item xs={12}>
          <TextField
            id='endpoint'
            label={(derivation as LateInitConnectedWallet).getLateInitLabel()}
            onChange={async (e) => {
              const url = e.target.value as string;
              (derivation as LateInitConnectedWallet).updateDataEndpoint(url);
              const rpcKey = getRPCKey(derivation.assetId ?? '', RPCs);
              if (rpcKey !== undefined && !rpcKey.includes('HBAR')) {
                RPCs[rpcKey].url = url;
                await saveSettings({ RPCs });
              }

              await prepareQuery.refetch();
            }}
          />
        </Grid>
      ) : (
        ''
      )}
      {/* {prepareQuery.isError
          ? 'Could not check UTXO data'
          : prepareQuery.data &&
            prepareQuery.data.utxos && (
              <Grid item flex='1'>
                Available Unspent Transaction Outputs (UTxOs)
                <DataGrid
                  rows={prepareQuery.data.utxos.map((utxo, idx) => ({
                    id: idx,
                    tx: utxo.txHash,
                    value: `${utxo.value} ${asset?.id}`,
                    confirmed: `${utxo.confirmed ? 'Yes' : 'No'}`,
                  }))}
                  columns={
                    [
                      {
                        field: 'tx',
                        headerName: 'Tx Hash',
                        type: 'string',
                        editable: false,
                        sortable: false,
                      },
                      {
                        field: 'value',
                        headerName: 'UTXO Value',
                        type: 'string',
                        editable: false,
                        sortable: true,
                      },
                      {
                        field: 'confirmed',
                        headerName: 'UTXO Confirmed',
                        type: 'boolean',
                        editable: false,
                        sortable: true,
                      },
                    ] as GridColDef[]
                  }
                  checkboxSelection
                  onRowSelectionModelChange={(newSelectionModel) => {
                    const utxos: UTXO[] = [];
                    (newSelectionModel as number[]).forEach((utxoIdx) => {
                      const utxo = prepareQuery.data.utxos![utxoIdx];
                      utxos.push(utxo);
                    });
                    setValue('utxos', utxos);
                  }}
                />
              </Grid>
            )} */}
      <Grid item xs={6}>
        {prepareQuery.data &&
        (!prepareQuery.data?.balance ||
          (prepareQuery.data?.insufficientBalance !== undefined && prepareQuery.data.insufficientBalance)) ? (
          <Typography variant='body1' color={(theme) => theme.palette.error.main}>
            Insufficient balance for transaction
          </Typography>
        ) : prepareQuery.data?.insufficientBalanceForTokenTransfer === true && prepareQuery.data?.insufficientBalance !== true ? (
          <Typography variant='body1' color={(theme) => theme.palette.error.main}>
            Insufficient fee asset balance for token transaction
          </Typography>
        ) : (
          ''
        )}
      </Grid>
      <Grid item xs={6} display='flex' justifyContent='flex-end'>
        <Button
          type='submit'
          disabled={
            !prepareQuery.data?.balance ||
            (prepareQuery.data &&
              prepareQuery.data?.insufficientBalance !== undefined &&
              prepareQuery.data.insufficientBalance) ||
            (prepareQuery.data && prepareQuery.data.insufficientBalanceForTokenTransfer)
          }
        >
          Prepare Transaction
        </Button>
      </Grid>
    </Grid>
  );
};
