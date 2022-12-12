import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { decryptInput } from "../../lib/schemas";
import {
  DialogProps,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
} from "@mui/material";
import { TextField, Button, monospaceFontFamily } from "shared";
import { useWallet } from "../../context/Wallet";

type FormData = z.infer<typeof decryptInput>;

type Props = Omit<DialogProps, "open" | "onClose" | "onSubmit"> & {
  isOpen: boolean;
  amount: number;
  assetSymbol: string;
  fromAddress: string;
  toAddress: string;
  onClose: () => void;
  onSubmit: (privateKey: string) => Promise<void>;
};

export const ConfirmationModal = ({
  isOpen,
  amount,
  assetSymbol,
  fromAddress,
  toAddress,
  onClose,
  onSubmit: _onSubmit,
  ...props
}: Props) => {
  const { state, handleDecryptPrivateKey } = useWallet();

  const headingId = useId();
  const descriptionId = useId();

  const [decryptionError, setDecryptionError] = useState<string | undefined>(
    undefined
  );

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(decryptInput),
    defaultValues: {
      passphrase: "",
    },
  });

  const onSubmit = async (formData: FormData) => {
    let privateKey: string;

    try {
      privateKey = handleDecryptPrivateKey(formData.passphrase);

      setDecryptionError(undefined);

      reset();
    } catch {
      setDecryptionError("Invalid passphrase");

      return;
    }

    await _onSubmit(privateKey);

    onClose();
  };

  return (
    <Dialog
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      maxWidth="lg"
      open={isOpen}
      onClose={onClose}
      {...props}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle id={headingId} variant="h1">
          Confirm Transaction
        </DialogTitle>
        <DialogContent sx={{ padding: "1rem" }}>
          <DialogContentText id={descriptionId} textAlign="center">
            Send {amount} {assetSymbol} from{" "}
            <Typography fontFamily={monospaceFontFamily}>
              {fromAddress}
            </Typography>{" "}
            to{" "}
            <Typography fontFamily={monospaceFontFamily}>
              {toAddress}
            </Typography>
            .
          </DialogContentText>
          {state === "encrypted" && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              marginTop="1rem"
            >
              <TextField
                id="passphrase"
                type="password"
                label="Private Key Passphrase"
                helpText="Set in Fireblocks Recovery Utility Settings"
                error={errors.passphrase?.message ?? decryptionError}
                autoFocus
                {...register("passphrase")}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: "1rem" }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Send Transaction</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
