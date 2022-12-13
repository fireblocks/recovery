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
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  TextField,
  Button,
  NextLinkComposed,
  monospaceFontFamily,
} from "shared";
import { useWallet } from "../../context/Wallet";

type FormData = z.infer<typeof decryptInput>;

type Props = Omit<DialogProps, "open" | "onClose" | "onSubmit"> & {
  isOpen: boolean;
  isLoading: boolean;
  error?: Error | null;
  amount: number;
  assetSymbol: string;
  fromAddress: string;
  toAddress: string;
  explorerUrl?: string;
  onClose: () => void;
  onSubmit: (privateKey: string) => void;
};

export const ConfirmationModal = ({
  isOpen,
  isLoading,
  error,
  amount,
  assetSymbol,
  fromAddress,
  toAddress,
  explorerUrl,
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

  const onSubmit = (formData: FormData) => {
    let privateKey: string;

    try {
      privateKey = handleDecryptPrivateKey(formData.passphrase);

      setDecryptionError(undefined);

      reset();
    } catch {
      setDecryptionError("Invalid passphrase");

      return;
    }

    _onSubmit(privateKey);

    onClose();
  };

  const txDescription = (
    <DialogContentText id={descriptionId} textAlign="center">
      {amount} {assetSymbol} from{" "}
      <Typography
        component="span"
        display="block"
        fontFamily={monospaceFontFamily}
      >
        {fromAddress}
      </Typography>{" "}
      to{" "}
      <Typography
        component="span"
        display="block"
        fontFamily={monospaceFontFamily}
      >
        {toAddress}
      </Typography>
    </DialogContentText>
  );

  return (
    <Dialog
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      maxWidth="sm"
      open={isOpen}
      onClose={onClose}
      {...props}
    >
      {isLoading ? (
        <DialogContent
          sx={{
            padding: "3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size="48px" />
        </DialogContent>
      ) : error ? (
        <>
          <DialogTitle id={headingId} variant="h1">
            Transaction Failed
          </DialogTitle>
          <DialogContent sx={{ padding: "1rem" }}>
            <DialogContentText>{txDescription}</DialogContentText>
            <Divider sx={{ margin: "1rem 0" }} />
            <DialogContentText
              fontFamily={monospaceFontFamily}
              color={(theme) => theme.palette.error.main}
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {error.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ padding: "1rem" }}>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </>
      ) : explorerUrl ? (
        <>
          <DialogTitle id={headingId} variant="h1">
            Sent Transaction
          </DialogTitle>
          <DialogContent sx={{ padding: "1rem" }}>
            <DialogContentText>{txDescription}</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ padding: "1rem" }}>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
            <Button
              component={NextLinkComposed}
              to={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ marginLeft: "8px" }}
            >
              View Transaction
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle id={headingId} variant="h1">
            Confirm Transaction
          </DialogTitle>
          <DialogContent sx={{ padding: "1rem" }}>
            <DialogContentText>{txDescription}</DialogContentText>
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
      )}
    </Dialog>
  );
};
