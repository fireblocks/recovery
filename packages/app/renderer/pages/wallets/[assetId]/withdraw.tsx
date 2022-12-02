import Head from "next/head";
import { useRouter } from "next/router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withdrawInput } from "../../../lib/schemas";
import { Box, Grid, Typography, Button } from "@mui/material";
import { TextField } from "../../../components/TextField";
import { getAssetName, getAssetIcon } from "../../../lib/assetInfo";
import { formatPath } from "../../../lib/bip44";

type FormData = z.infer<typeof withdrawInput>;

type WithdrawVariables = {
  assetId: string;
  accountId: string;
  change: string;
  index: string;
  testnet: boolean;
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
    account: variables.accountId,
    change: variables.change,
    index: variables.index,
    testnet: String(variables.testnet),
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
  const router = useRouter();

  const assetId = (router.query.assetId ?? "") as string;
  const path = (router.query.path ?? "") as string;
  const testnet = (router.query.testnet as string)?.toLowerCase?.() === "test";

  const [_, coinType, accountId, change, index] = path.split(",");

  const assetName = getAssetName(assetId);

  const title = `${assetName} Withdrawal`;

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
      assetId,
      accountId,
      change,
      index,
      testnet,
      to: formData.to,
      amount: formData.amount,
      memo: formData.memo,
    });

  return (
    <Box component="form" padding="1rem" onSubmit={handleSubmit(onSubmit)}>
      <Head>
        <title>{title}</title>
      </Head>
      <Grid container spacing={2} alignItems="center" marginBottom="1rem">
        <Grid item>{getAssetIcon(assetId)}</Grid>
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
            label="BIP32 Path"
            value={formatPath(path)}
            enableCopy
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
            variant="contained"
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
