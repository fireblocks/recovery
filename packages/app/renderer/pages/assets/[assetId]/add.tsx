import Head from "next/head";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { deriveKeysInput } from "../../../lib/schemas";
import {
  Box,
  Grid,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { AssetId, AssetType, AssetIcon, Button, TextField } from "shared";
import { deserializePath } from "../../../lib/bip44";
import { addWallets } from "../../../lib/ipc/addWallets";
import { closeWindow } from "../../../lib/ipc/closeWindow";
import { useWorkspace } from "../../../context/Workspace";

type FormData = z.infer<typeof deriveKeysInput>;

const AddWallets = () => {
  const { asset, currentAssetWallets } = useWorkspace();

  const title = `Add ${asset?.name} Wallets`;

  const defaultAccountIdStart = useMemo(() => {
    let greatestAccountId = -1;

    currentAssetWallets.forEach((wallet) => {
      const { accountId } = deserializePath(wallet.pathParts);

      if (accountId > greatestAccountId) {
        greatestAccountId = accountId;
      }
    });

    return greatestAccountId + 1;
  }, [currentAssetWallets]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(deriveKeysInput),
    defaultValues: {
      accountIdStart: defaultAccountIdStart,
      accountIdEnd: defaultAccountIdStart,
      indexStart: 0,
      indexEnd: 0,
    },
  });

  const values = watch();

  const newWalletCount = useMemo(() => {
    const { accountIdStart, accountIdEnd, indexStart, indexEnd } = values;

    const accountCount = accountIdEnd - accountIdStart + 1;
    const indexCount = indexEnd - indexStart + 1;

    const total = accountCount * indexCount;

    return isNaN(total) ? 0 : total;
  }, [values]);

  const onSubmit = async (formData: FormData) => {
    addWallets({
      assetId: asset?.id as AssetId,
      isTestnet: false,
      accountIdStart: formData.accountIdStart,
      accountIdEnd: formData.accountIdEnd,
      indexStart: formData.indexStart,
      indexEnd: formData.indexEnd,
    });

    closeWindow();
  };

  return (
    <Box component="form" padding="1em" onSubmit={handleSubmit(onSubmit)}>
      <Head>
        <title>{title}</title>
      </Head>
      <Grid container spacing={2} alignItems="center" marginBottom="1rem">
        <Grid item>
          <AssetIcon assetId={asset?.id as AssetId} />
        </Grid>
        <Grid item>
          <Typography variant="h1" margin={0}>
            {title}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h2">Vault Account ID</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="accountIdStart"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                label="Start"
                error={errors.accountIdStart?.message}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                {...register("accountIdStart", { valueAsNumber: true })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="accountIdEnd"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                label="End"
                error={errors.accountIdEnd?.message}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                {...register("accountIdEnd", { valueAsNumber: true })}
              />
            </Grid>
          </Grid>
        </Grid>
        {asset?.type === AssetType.UTXO ? (
          <Grid item xs={6}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h2">Index</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id="indexStart"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  label="Start"
                  error={errors.indexStart?.message}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  {...register("indexStart", { valueAsNumber: true })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id="indexEnd"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  label="End"
                  error={errors.indexEnd?.message}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  {...register("indexEnd", { valueAsNumber: true })}
                />
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <>
            <input
              type="hidden"
              {...register("indexStart", { valueAsNumber: true })}
            />
            <input
              type="hidden"
              {...register("indexEnd", { valueAsNumber: true })}
            />
          </>
        )}
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button type="submit" color="primary" disabled={newWalletCount < 1}>
            Add {newWalletCount} Wallets
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddWallets;
