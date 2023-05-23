import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
} from '@fireblocks/recovery-shared';
import { AssetConfig } from '@fireblocks/asset-config';
import { useWorkspace } from '../../../context/Workspace';
import { Derivation, AccountData } from '../../../lib/wallets';
import { UTXO } from '../../../lib/wallets/types';
import { LateInitConnectedWallet } from '../../../lib/wallets/LateInitConnectedWallet';

const getWallet = (accounts: Map<number, VaultAccount<Derivation>>, accountId?: number, assetId?: string) => {
  if (typeof accountId === 'undefined' || typeof assetId === 'undefined') {
    return undefined;
  }

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

  const derivation = wallet?.derivations?.get(fromAddress);

  // const balanceQueryKey = ['balance', accountId, asset?.id, fromAddress];

  // const balanceQuery = useQuery({
  //   queryKey: balanceQueryKey,
  //   enabled: !!derivation,
  //   queryFn: async () => derivation!.getBalance?.(),
  //   onError: (err: Error) => console.error('Failed to query balance', err),
  // });

  // TODO: Show both original balance and adjusted balance in create tx UI

  const prepareQueryKey = ['prepare', fromAddress, values.memo];

  const prepareQuery = useQuery({
    queryKey: prepareQueryKey,
    enabled: !!derivation,
    queryFn: async () => derivation!.prepare?.(toAddress, values.memo),
    onSuccess: (prepare: AccountData) => {
      console.info('UTXOs', prepare.utxos);

      // if (prepare.utxos) {
      //   setTransactionInput((prev) => ({ ...prev, utxos: [] }));
      // }
    },
    onError: (err: Error) => console.error('Failed to prepare transaction parameters', err),
  });

  const isLoading = !!prepareQuery.isLoading; // || balanceQuery.isLoading

  const onSubmit = (data: TransactionInput) => {
    if (!asset?.id || !derivation) {
      console.error('No derivation found:', derivation);
      return;
    }

    if (typeof asset === 'undefined' || !('coinType' in asset)) {
      console.error('No coin type found for asset', asset.id);
      return;
    }

    const balance = prepareQuery.data?.balance;

    if (typeof balance === 'undefined') {
      console.error('No balance found for derivation', derivation);
      return;
    }

    console.info('Prepare:', prepareQuery.data);

    // TODO: Update UTXOs in response to maximize how many we can fit in the QR code up to the target balance
    let maxUtxo: UTXO | undefined = undefined;

    if (prepareQuery.data?.utxos) {
      maxUtxo = prepareQuery.data.utxos.reduce((prev, curr) => {
        if (
          typeof prev.value !== 'undefined' &&
          typeof curr.value !== 'undefined' &&
          prev.value < curr.value &&
          curr.value <= balance
        ) {
          return curr;
        }

        return prev;
      });
    }

    const utxos = maxUtxo ? [maxUtxo] : undefined;

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
        extraParams: prepareQuery.data?.extraParams,
        utxos,
        endpoint: derivation.isLateInit() ? prepareQuery.data?.endpoint : undefined,
      },
      // memo: data.memo,
    });
  };

  const fromAddressId = useId();
  const balanceId = useId();
  const addressExplorerId = useId();

  console.info({
    txId,
    accountId,
    values,
    asset,
    derivation,
    prepare: prepareQuery.data,
  });

  return (
    <Grid
      component='form'
      container
      spacing={2}
      alignItems='center'
      justifyContent='center'
      onSubmit={handleSubmit(onSubmit, console.error)}
    >
      <Grid item xs={8}>
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
      <Grid item xs={4}>
        <Grid container spacing={2} alignItems='flex-end' justifyContent='space-between' height='72px'>
          <Grid item flex='1'>
            <InputLabel
              shrink
              htmlFor={balanceId}
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#000000',
              }}
            >
              Balance
            </InputLabel>
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
                  : `${prepareQuery.data?.balance} ${asset?.id}`}
              </Typography>
            )}
          </Grid>
          {!!asset && 'expUrl' in asset && (
            <Grid item flex='1'>
              <Button
                id={addressExplorerId}
                variant='outlined'
                component={NextLinkComposed}
                to={`${asset.expUrl}/address/${fromAddress}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                Open Explorer
              </Button>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography variant='body1' paragraph>
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
              (derivation as LateInitConnectedWallet).updateDataEndpoint(e.target.value as string);
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
      <Grid item xs={12} display='flex' justifyContent='flex-end'>
        <Button type='submit' disabled={!prepareQuery.data?.balance}>
          Prepare Transaction
        </Button>
      </Grid>
    </Grid>
  );
};
