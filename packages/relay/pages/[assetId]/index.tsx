import type { NextPageWithLayout } from "../_app";
import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { useRef, useId, useState, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { transactionInput } from "../../lib/schemas";
import {
  Typography,
  Box,
  Grid,
  InputLabel,
  CircularProgress,
} from "@mui/material";
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
} from "shared";
import { useWallet } from "../../context/Wallet";
import { Logo } from "../../components/Logo";
import { ConfirmationModal } from "../../components/ConfirmationModal";

type FormData = z.infer<typeof transactionInput>;

type Props = {
  assetId: AssetId;
};

const Wallet: NextPageWithLayout<Props> = ({ assetId }) => {
  const { address, newTx, walletInstance, handleTransaction } = useWallet();

  const initialTxRef = useRef(newTx);

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
    defaultValues: {
      to: newTx.to ?? "",
      amount: newTx.amount ?? 0,
    },
  });

  useEffect(() => {
    if (newTx !== initialTxRef.current) {
      reset({
        to: newTx.to ?? "",
        amount: newTx.amount ?? 0,
      });
    }
  }, [reset, newTx]);

  const onCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);

    if (txHash) {
      setTxHash(undefined);
      reset({ to: "", amount: 0 });
    }
  };

  const values = watch();

  const queryClient = useQueryClient();

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

  const txMutation = useMutation({
    mutationFn: async (variables: { privateKey: string }) => {
      if (!walletInstance) {
        throw new Error("No wallet instance found");
      }

      const txHash = await walletInstance.sendTransaction(
        variables.privateKey,
        values.to,
        values.amount
      );

      return txHash;
    },
    onSuccess: (txHash) => {
      setTxHash(txHash);

      handleTransaction({
        ...newTx,
        state: "success",
        to: values.to,
        amount: values.amount,
        hash: txHash,
      });

      queryClient.setQueryData(balanceQueryKey, (balance: number | undefined) =>
        typeof balance === "number"
          ? Math.max(balance - values.amount, 0)
          : balance
      );

      setTimeout(balanceQuery.refetch, 1000);
    },
    onError: (error: Error) => {
      console.error(error);

      handleTransaction({
        ...newTx,
        state: "error",
        error,
      });

      return error;
    },
  });

  const onSubmit = () => setIsConfirmationModalOpen(true);

  const onConfirmTransaction = (privateKey: string) =>
    txMutation.mutate({ privateKey });

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
              {balanceQuery.isLoading ? (
                <CircularProgress size="24px" />
              ) : (
                <Typography
                  id={balanceId}
                  noWrap
                  fontFamily={
                    balanceQuery.isError ? undefined : monospaceFontFamily
                  }
                  sx={{ userSelect: "text", cursor: "default" }}
                >
                  {balanceQuery.isError
                    ? "Could not get balance"
                    : `${balanceQuery.data} ${asset?.id}`}
                </Typography>
              )}
            </Grid>
            {!!addressUrl && (
              <Grid item>
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
            )}
          </Grid>
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
            {...register("amount", {
              valueAsNumber: true,
              min: 0,
              max: balanceQuery.data,
            })}
          />
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button type="submit">Send</Button>
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
        explorerUrl={txUrl}
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
