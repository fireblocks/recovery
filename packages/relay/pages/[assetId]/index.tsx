import type { NextPageWithLayout } from "../_app";
import { useRouter } from "next/router";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { transactionInput } from "../../lib/schemas";
import { WalletClasses } from "../../lib/wallets";
import { Box, Grid, Divider } from "@mui/material";
import { TextField, Button } from "shared";
import { useWallet, Transaction } from "../../context/Wallet";
import { Logo } from "../../components/Logo";
import { BaseWallet } from "../../lib/wallets/BaseWallet";
import { ConfirmationModal } from "../../components/ConfirmationModal";

type FormData = z.infer<typeof transactionInput>;

const Wallet: NextPageWithLayout = () => {
  const router = useRouter();

  const { assetId, address, transactions, walletInstance, handleTransaction } =
    useWallet();

  const newTx = useMemo<Transaction>(() => {
    const transactionsDescending = transactions.slice().reverse();

    const newTx = transactionsDescending.find((tx) => tx.state === "init");

    return newTx ?? { state: "init" };
  }, [transactions]);

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const onCloseConfirmationModal = () => setIsConfirmationModalOpen(false);

  const {
    register,
    watch,
    handleSubmit,
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

  const values = watch();

  const onSubmit = async (data: FormData) => {
    console.info("Tx form data:", { data });

    setIsConfirmationModalOpen(true);
  };

  const onConfirmTransaction = async (privateKey: string) => {
    if (!walletInstance) {
      throw new Error("No wallet instance found");
    }

    const txHash = await walletInstance.sendTransaction(
      privateKey,
      values.to,
      values.amount
    );

    handleTransaction({
      ...newTx,
      state: "broadcasting",
      to: values.to,
      amount: values.amount,
      hash: txHash,
    });
  };

  useEffect(() => {
    if (!walletInstance) {
      router.push("/");
    }
  }, [walletInstance]);

  return (
    <Box
      height="100%"
      padding="1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Logo marginBottom="2em" />
      <Grid
        component="form"
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
            id="senderAddress"
            label="Sender Address"
            value={address}
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
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button type="submit">Send</Button>
        </Grid>
      </Grid>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        amount={values.amount}
        assetSymbol={assetId?.split("_")[0] ?? ""}
        fromAddress={address ?? ""}
        toAddress={values.to}
        onClose={onCloseConfirmationModal}
        onSubmit={onConfirmTransaction}
      />
    </Box>
  );
};

export default Wallet;
