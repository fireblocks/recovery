import type { NextPageWithLayout } from "../_app";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { transactionInput } from "../../lib/schemas";
import { Box, Grid, Divider } from "@mui/material";
import { TextField, Button } from "styles";
import { useWallet, Transaction } from "../../context/Wallet";
import { Logo } from "../../components/Logo";

type FormData = z.infer<typeof transactionInput>;

const Wallet: NextPageWithLayout = () => {
  const { assetId, privateKey, transactions } = useWallet();

  const newTx = useMemo<Transaction>(() => {
    const transactionsDescending = transactions.slice().reverse();

    const newTx = transactionsDescending.find((tx) => tx.state === "init");

    return newTx ?? { state: "init" };
  }, [transactions]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(transactionInput),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      to: newTx.to ?? "",
      amount: newTx.amount ?? 0,
      memo: newTx.memo ?? "",
    },
  });

  const onSubmit = (data: FormData) => console.info({ data });

  return (
    <Box
      height="100%"
      padding="1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      component="form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Logo marginBottom="2em" />
      <Grid
        maxWidth="600px"
        container
        spacing={2}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={12}>
          <TextField
            id="assetId"
            label="Asset ID"
            value={assetId}
            readOnly
            isMonospace
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="privateKey"
            type="password"
            label="Private Key"
            value={privateKey}
            enableCopy
            isMonospace
          />
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ margin: "1em 0" }} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="to"
            label="Recipient Address"
            error={errors.to?.message}
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
            isMonospace
            {...register("amount", { valueAsNumber: true })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="memo"
            type="number"
            label="Memo"
            error={errors.memo?.message}
            {...register("memo")}
          />
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button type="submit">Send</Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Wallet;
