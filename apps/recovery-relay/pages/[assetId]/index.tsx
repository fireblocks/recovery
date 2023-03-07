import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { useId, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Typography,
  Box,
  Grid,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  AssetIcon,
  TextField,
  Button,
  Link,
  NextLinkComposed,
  monospaceFontFamily,
  getAssetInfo,
  assetIds,
  AssetId,
} from "@fireblocks/recovery-shared";
import type { NextPageWithLayout } from "../_app";
import { useWallet } from "../../context/Wallet";
import { Logo } from "../../components/Logo";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { AccountData, UTXO } from "../../lib/wallets/types";
import { transactionInput } from "../../lib/schemas";

type FormData = z.infer<typeof transactionInput>;

type TxMutationVariables = FormData;

const defaultValues: FormData = {
  to: "",
  amount: 0,
};

type Props = {
  assetId: AssetId;
};

const Wallet: NextPageWithLayout<Props> = ({ assetId }: Props) => {
  const { address, walletInstance, handleTransaction } = useWallet();

  const asset = getAssetInfo(assetId);
  const title = `${asset?.name} Wallet`;

  const fromAddressId = useId();
  const balanceId = useId();
  const addressExplorerId = useId();

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const addressUrl = address
    ? asset?.getExplorerUrl(address, "address")
    : undefined;
  const txUrl = txHash ? asset?.getExplorerUrl(txHash, "tx") : undefined;

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(transactionInput),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues,
  });

  const onCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);

    if (txHash) {
      setTxHash(undefined);
      reset({ to: "", amount: 0 });
    }
  };

  const values = watch();

  const balanceQueryKey = ["balance", address];

  const balanceQuery = useQuery({
    queryKey: balanceQueryKey,
    enabled: !!walletInstance,
    queryFn: async () => {
      const balance = await walletInstance?.getBalance();

      return balance;
    },
    onSuccess: (balance) => {
      if (typeof balance === "number") {
        setValue("amount", Math.min(balance, values.amount));
      }
    },
  });

  const prepareQueryKey = ["prepare"];

  const prepareQuery = useQuery({
    queryKey: prepareQueryKey,
    enabled: !!walletInstance,
    queryFn: async () => {
      const prepare = await walletInstance?.prepare();

      return prepare;
    },
    onSuccess: (prepare: AccountData) => {
      if (prepare.utxos) {
        setValue("utxos", []);
      }
      setValue("amount", Math.min(prepare.balance, values.amount));
    },
  });

  const txMutation = useMutation({
    mutationFn: async (variables: TxMutationVariables) => {
      if (!walletInstance) {
        throw new Error("No wallet instance found");
      }

      const { to, amount, utxos, memo } = variables;

      const txPayload = await walletInstance.generateTx(
        to,
        amount,
        memo,
        utxos
      );

      return txPayload;
    },
    onSuccess: () => {
      // setTxHash(txHash);
      // queryClient.setQueryData(balanceQueryKey, (balance: number | undefined) =>
      //   typeof balance === "number"
      //     ? Math.max(balance - values.amount, 0)
      //     : balance
      // );
      // setTimeout(balanceQuery.refetch, 1000);
    },
    onError: (error: Error) => {
      console.error(error);

      handleTransaction({
        state: "error",
        to: values.to,
        amount: values.amount,
        error,
      });

      return error;
    },
  });

  const onSubmit = () => setIsConfirmationModalOpen(true);

  const onConfirmTransaction = () =>
    txMutation.mutate({ to: values.to, amount: values.amount });

  return (
    <Box
      minHeight="100%"
      padding="3em 1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Head>
        <title>Fireblocks Recovery Relay &raquo; {title}</title>
      </Head>
      <Grid
        component="form"
        maxWidth="600px"
        container
        spacing={2}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={12}>
          <Link href="/" underline="none">
            <Logo marginBottom="1em" justifyContent="flex-start" />
          </Link>
          <Typography variant="h1" display="flex" alignItems="center">
            <Box display="flex" alignItems="center" marginRight="0.5rem">
              <AssetIcon assetId={asset?.id} />
            </Box>
            {title}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <InputLabel
            shrink
            htmlFor={fromAddressId}
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#000000",
              userSelect: "text",
            }}
          >
            Address
          </InputLabel>
          <Typography
            id={fromAddressId}
            fontFamily={monospaceFontFamily}
            noWrap
            sx={{ userSelect: "text", cursor: "default" }}
          >
            {address}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          {prepareQuery.isLoading ? (
            <CircularProgress size="24px" />
          ) : (
            <Grid
              container
              spacing={2}
              alignItems="flex-end"
              justifyContent="space-between"
              height="72px"
            >
              <Grid item flex="1">
                <InputLabel
                  shrink
                  htmlFor={balanceId}
                  sx={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#000000",
                  }}
                >
                  Balance
                </InputLabel>
                <Typography
                  id={balanceId}
                  noWrap
                  fontFamily={
                    prepareQuery.isError ? undefined : monospaceFontFamily
                  }
                  sx={{ userSelect: "text", cursor: "default" }}
                >
                  {prepareQuery.isError
                    ? "Could not get balance"
                    : `${prepareQuery.data.balance} ${asset?.id}`}
                </Typography>
              </Grid>
              <Grid item flex="1">
                <Button
                  id={addressExplorerId}
                  variant="outlined"
                  component={NextLinkComposed}
                  to={addressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Explorer
                </Button>
              </Grid>
            </Grid>
          )}
        </Grid>
        {/* <Grid item xs={12}>
          <Divider sx={{ margin: "1em 0" }} />
        </Grid> */}
        <Grid item xs={12}>
          <Typography variant="h2">New Transaction</Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="to"
            label="Recipient Address"
            error={errors.to?.message}
            disabled={txMutation.isLoading}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            isMonospace
            {...register("to")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="amount"
            type="number"
            label="Amount"
            error={errors.amount?.message}
            disabled={balanceQuery.isLoading || txMutation.isLoading}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            isMonospace
            inputProps={{
              min: 0,
              max: balanceQuery.data,
              step: 0.1,
            }}
            {...register("amount", { valueAsNumber: true })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="memo"
            label="Memo or Tag field (when applicable)"
            error={errors.to?.message}
            disabled={txMutation.isLoading}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            isMonospace
            {...register("memo")}
          />
        </Grid>
        {prepareQuery.isError
          ? "Could not check UTXO data"
          : prepareQuery.data &&
            prepareQuery.data.utxos && (
              <Grid item flex="1">
                Available UTXOs
                <DataGrid
                  rows={prepareQuery.data.utxos.map((utxo, idx) => ({
                    id: idx,
                    tx: utxo.txHash,
                    value: `${utxo.value} ${asset.id}`,
                    confirmed: `${utxo.confirmed ? "Yes" : "No"}`,
                  }))}
                  columns={
                    [
                      {
                        field: "tx",
                        headerName: "Tx Hash",
                        type: "string",
                        editable: false,
                        sortable: false,
                      },
                      {
                        field: "value",
                        headerName: "UTXO Value",
                        type: "string",
                        editable: false,
                        sortable: true,
                      },
                      {
                        field: "confirmed",
                        headerName: "UTXO Confirmed",
                        type: "boolean",
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
                    setValue("utxos", utxos);
                  }}
                />
              </Grid>
            )}
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            disabled={prepareQuery.isLoading || txMutation.isLoading}
          >
            Send
          </Button>
        </Grid>
      </Grid>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        isLoading={txMutation.isLoading}
        error={txMutation.error}
        amount={values.amount}
        assetSymbol={asset?.id ?? ""}
        fromAddress={address ?? ""}
        toAddress={values.to}
        txUrl={txUrl}
        onClose={onCloseConfirmationModal}
        onSubmit={onConfirmTransaction}
      />
    </Box>
  );
};

export default Wallet;

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => ({
  props: {
    assetId: params?.assetId as AssetId,
  },
});

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: assetIds.map((assetId) => ({ params: { assetId } })),
  fallback: false,
});
