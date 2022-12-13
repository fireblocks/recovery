import Head from "next/head";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withdrawInput } from "../../../lib/schemas";
import { Box, Grid, Typography } from "@mui/material";
import { theme, AssetIcon, TextField, AssetId } from "shared";
import { QrCode } from "../../../components/QrCode";
import { useSettings } from "../../../context/Settings";
import { useWorkspace } from "../../../context/Workspace";

type FormData = z.infer<typeof withdrawInput>;

const Withdraw = () => {
  const { getRelayUrl } = useSettings();

  const { asset, privateKey, address } = useWorkspace();

  const title = `${asset?.name} Withdrawal`;

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(withdrawInput),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      to: "",
      amount: 0,
    },
  });

  const { to, amount } = watch();

  return (
    <Box component="form" padding="1em">
      <Head>
        <title>{title}</title>
      </Head>
      <Typography
        variant="h1"
        display="flex"
        alignItems="center"
        margin="0 0 1rem 0"
      >
        <Box display="flex" alignItems="center" marginRight="0.5rem">
          <AssetIcon assetId={asset?.id as AssetId} />
        </Box>
        {title}
      </Typography>
      <Typography variant="body1" paragraph>
        Scan the QR code with an online device to send a transaction with
        Fireblocks Recovery Relay.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body1" paragraph>
            Set a passphrase for URL encryption or a self-hosted Relay URL in
            Settings.
          </Typography>
          <Typography variant="body1" paragraph>
            Set transaction information here to pre-fill the Relay URL.
          </Typography>
          <Grid container spacing={2} marginTop="16px">
            <Grid item xs={12}>
              <TextField
                id="recipientAddress"
                label="Recipient Address"
                error={errors.to?.message}
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
                inputProps={{ min: 0, step: 1 }}
                label="Amount"
                error={errors.amount?.message}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                isMonospace
                {...register("amount", { valueAsNumber: true })}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <QrCode
            data={getRelayUrl({
              assetId: asset?.id as AssetId,
              address: address as string,
              privateKey: privateKey as string,
              tx: { to, amount },
            })}
            title="Open with an online device"
            bgColor={theme.palette.background.default}
            includeMargin={false}
            noFieldPadding
            formControlProps={{ sx: { marginTop: "auto" } }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Withdraw;
