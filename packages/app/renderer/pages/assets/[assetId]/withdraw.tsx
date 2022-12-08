import Head from "next/head";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withdrawInput } from "../../../lib/schemas";
import { Box, Grid, Typography } from "@mui/material";
import { TextField } from "../../../components/TextField";
import { Button } from "../../../components/Button";
import { deserializePath, serializePath } from "../../../lib/bip44";
import { useWorkspace } from "../../../context/Workspace";

type FormData = z.infer<typeof withdrawInput>;

type WithdrawVariables = {
  assetId: string;
  accountId: number;
  index: number;
  isTestnet: boolean;
  to: string;
  amount: number;
  abi?: string;
  contractCallParams?: { key: string; value: string }[];
  fee?: { rate: string; gasPrice: string; gasLimit: string };
  memo?: string;
};

type WithdrawResponse = { tx: string };

const withdraw = async (variables: WithdrawVariables) => {
  const searchParams = new URLSearchParams({
    asset: variables.assetId.split("_TEST")[0],
    account: String(variables.accountId),
    change: "0",
    index: String(variables.index),
    isTestnet: String(variables.isTestnet),
  });

  // TODO: USE DYNAMIC PORT
  const res = await fetch(`http://localhost:8000/create-tx?${searchParams}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: variables.to,
      amount: variables.amount,
      memo: variables.memo,
    }),
  });

  const { tx } = (await res.json()) as WithdrawResponse;

  return tx;
};

const Withdraw = () => {
  const { asset, pathParts, isTestnet } = useWorkspace();

  const { coinType, accountId, change, index } = deserializePath(pathParts);

  const title = `${asset?.name} Withdrawal`;

  const AssetIcon = asset?.Icon ?? (() => null);

  const withdrawMutation = useMutation({
    mutationFn: withdraw,
    onSuccess: (tx) => {
      const qrCodeParams = new URLSearchParams({
        data: tx,
        label: `${title} Transaction`,
      });

      window.open(`/qr?${qrCodeParams.toString()}`, "_blank");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(withdrawInput),
  });

  const onSubmit = (formData: FormData) =>
    withdrawMutation.mutate({
      assetId: asset?.id as string,
      accountId,
      index,
      isTestnet: !!isTestnet,
      to: formData.to,
      amount: formData.amount,
      memo: formData.memo,
    });

  return (
    <Box component="form" padding="1em" onSubmit={handleSubmit(onSubmit)}>
      <Head>
        <title>{title}</title>
      </Head>
      <Grid container spacing={2} alignItems="center" marginBottom="1rem">
        <Grid item>
          <AssetIcon />
        </Grid>
        <Grid item>
          <Typography variant="h1" margin={0}>
            {title}
          </Typography>
        </Grid>
      </Grid>
      <Typography variant="body1" paragraph>
        Build a transaction to be broadcast on a separate online device.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            id="path"
            label="HD Path"
            value={serializePath(pathParts)}
            enableCopy
            isMonospace
          />
        </Grid>
        <Grid item xs={6} display="flex">
          <Grid container spacing={1} alignSelf="flex-end">
            <Grid item xs={6}>
              <Typography variant="body1">Coin Type: {coinType}</Typography>
              <Typography variant="body1">Account: {accountId}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">Change: {change}</Typography>
              <Typography variant="body1">Index: {index}</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="recipientAddress"
            label="Recipient Address"
            error={errors.to?.message}
            disabled={withdrawMutation.isLoading}
            isMonospace
            {...register("to")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="amount"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            label="Amount"
            error={errors.amount?.message}
            disabled={withdrawMutation.isLoading}
            {...register("amount", { valueAsNumber: true })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="memo"
            label="Memo"
            error={errors.memo?.message}
            disabled={withdrawMutation.isLoading}
            {...register("memo")}
          />
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            color="primary"
            disabled={withdrawMutation.isLoading}
          >
            Build Transaction
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Withdraw;
