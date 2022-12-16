import { useState, useMemo, MouseEvent, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { TextField, Button, AssetId, AssetType, AssetInfo } from "shared";
import {
  Box,
  Grid,
  Typography,
  InputBaseProps,
  Popover,
  PopoverOrigin,
} from "@mui/material";
import { useForm, RegisterOptions } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { deriveKeysInput } from "../../lib/schemas";
import { deserializePath } from "../../lib/bip44";
import { useWorkspace } from "../../context/Workspace";
import { getWallets } from "./getWallets";

type FormData = z.infer<typeof deriveKeysInput>;

type Props = {
  asset: AssetInfo;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
};

const registerOptions: RegisterOptions<FormData> = { valueAsNumber: true };

export const AddWallets = ({ asset, anchorOrigin, transformOrigin }: Props) => {
  const { currentAssetWallets, handleAddWallets } = useWorkspace();

  const [keyDerivationError, setKeyDerivationError] = useState<
    string | undefined
  >(undefined);

  const [addWalletsAnchorElement, setAddWalletsAnchorElement] =
    useState<HTMLButtonElement | null>(null);

  const handleClickAddWallets = (event: MouseEvent<HTMLButtonElement>) =>
    setAddWalletsAnchorElement(event.currentTarget);

  const handleCloseAddWallets = () => setAddWalletsAnchorElement(null);

  const isAddWalletsPopoverOpen = Boolean(addWalletsAnchorElement);

  const addWalletsId = isAddWalletsPopoverOpen ? "addWallets" : undefined;

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

  const defaultValues = {
    accountIdStart: defaultAccountIdStart,
    accountIdEnd: defaultAccountIdStart,
    indexStart: 0,
    indexEnd: 0,
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(deriveKeysInput),
    defaultValues,
  });

  const { accountIdStart, accountIdEnd, indexStart, indexEnd } = watch();

  const accountCount = accountIdEnd - accountIdStart + 1;
  const indexCount = indexEnd - indexStart + 1;
  const total = accountCount * indexCount;
  const newWalletCount = isNaN(total) ? 0 : total;

  const addWalletsMutation = useMutation({
    mutationFn: getWallets,
    onSuccess: (newWallets) => {
      handleAddWallets(newWallets);

      setKeyDerivationError(undefined);
    },
    onError: (error) => {
      console.error(error);

      setKeyDerivationError((error as Error).message);
    },
  });

  const onSubmit = (formData: FormData) =>
    addWalletsMutation.mutate({
      assetId: asset?.id as AssetId,
      accountIdStart: formData.accountIdStart,
      accountIdEnd: formData.accountIdEnd,
      indexStart: formData.indexStart,
      indexEnd: formData.indexEnd,
    });

  const isUtxo = asset?.type === AssetType.UTXO;

  const textFieldProps = (textFieldRight = false): InputBaseProps => ({
    type: "number",
    autoComplete: "off",
    autoCapitalize: "off",
    spellCheck: false,
    size: "small",
    inputProps: { min: 0, step: 1 },
    disabled: addWalletsMutation.isLoading,
    sx: textFieldRight
      ? {
          borderLeft: "0",
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
        }
      : {
          borderTopRightRadius: "0",
          borderBottomRightRadius: "0",
        },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => reset(defaultValues), [asset?.id]);

  return (
    <>
      <Button
        color="primary"
        aria-describedby={addWalletsId}
        onClick={handleClickAddWallets}
      >
        Add Wallets
      </Button>
      <Popover
        id={addWalletsId}
        open={isAddWalletsPopoverOpen}
        anchorEl={addWalletsAnchorElement}
        onClose={handleCloseAddWallets}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        <Box
          component="form"
          padding="1em"
          width="300px"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h2">Vault Account ID</Typography>
              <Box display="flex" alignItems="center">
                <TextField
                  {...textFieldProps()}
                  {...register("accountIdStart", registerOptions)}
                  id="accountIdStart"
                  label="Start"
                  error={errors.accountIdStart?.message}
                  autoFocus
                />
                <TextField
                  {...textFieldProps(true)}
                  {...register("accountIdEnd", registerOptions)}
                  id="accountIdEnd"
                  label="End"
                  error={errors.accountIdEnd?.message}
                />
              </Box>
            </Grid>
            {isUtxo ? (
              <Grid item xs={12}>
                <Typography variant="h2">Deposit Addresses (Index)</Typography>
                <Box display="flex" alignItems="center">
                  <TextField
                    {...textFieldProps()}
                    {...register("indexStart", registerOptions)}
                    id="indexStart"
                    label="Start"
                    error={errors.indexStart?.message}
                  />
                  <TextField
                    {...textFieldProps(true)}
                    {...register("indexEnd", registerOptions)}
                    id="indexEnd"
                    label="End"
                    error={errors.indexEnd?.message}
                  />
                </Box>
              </Grid>
            ) : (
              <>
                <input
                  type="hidden"
                  {...register("indexStart", registerOptions)}
                />
                <input
                  type="hidden"
                  {...register("indexEnd", registerOptions)}
                />
              </>
            )}
            <Grid item xs={12}>
              <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent="flex-end"
                marginTop="auto"
              >
                <Grid item flex="1">
                  <Typography
                    variant="body1"
                    color={(theme) => theme.palette.error.main}
                  >
                    {keyDerivationError}
                  </Typography>
                </Grid>
                <Grid item>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={
                      newWalletCount < 1 || addWalletsMutation.isLoading
                    }
                  >
                    Add Wallets
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    </>
  );
};
