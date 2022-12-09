import Head from "next/head";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withdrawInput } from "../../../lib/schemas";
import { Box, Grid, Typography } from "@mui/material";
import { TextField, theme } from "styles";
import { QrCode } from "../../../components/QrCode";
import { useSettings } from "../../../context/Settings";
import { useWorkspace } from "../../../context/Workspace";

type FormData = z.infer<typeof withdrawInput>;

const Withdraw = () => {
  const { getRelayUrl } = useSettings();

  const { asset, address, privateKey } = useWorkspace();

  const title = `${asset?.name} Withdrawal`;

  const AssetIcon = asset?.Icon ?? (() => null);

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(withdrawInput),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      amount: 0,
      memo: "Sent with Fireblocks Recovery Utility & Recovery Relay",
    },
  });

  const { to, amount, memo } = watch();

  return (
    <Box component="form" padding="1em">
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
        Send a transaction with Fireblocks Recovery Relay by scanning the QR
        code with your mobile device.
      </Typography>
      <Typography variant="body1" paragraph>
        Set a passphrase in Recovery Utility Settings to encrypt your private
        key in withdrawal URLs.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id="recipientAddress"
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
                inputProps={{ min: 0, step: 1 }}
                label="Amount"
                error={errors.amount?.message}
                isMonospace
                {...register("amount", { valueAsNumber: true })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="memo"
                label="Memo"
                error={errors.memo?.message}
                {...register("memo")}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <QrCode
            data={getRelayUrl({
              assetId: asset?.id as string,
              privateKey: privateKey as string,
              to,
              amount,
              memo,
            })}
            title="Open with an online device"
            bgColor={theme.palette.background.default}
            includeMargin={false}
            noFieldPadding
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Withdraw;
