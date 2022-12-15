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
  txUrl?: string;
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
  txUrl,
  onClose,
  onSubmit: _onSubmit,
  ...props
}: Props) => {
  const { handleDecryptPrivateKey } = useWallet();

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
      pin: "",
    },
  });

  const onSubmit = async (formData: FormData) => {
    try {
      setDecryptionError(undefined);

      const privateKey = await handleDecryptPrivateKey(formData.pin);

      reset();

      _onSubmit(privateKey);
    } catch {
      setDecryptionError("Invalid PIN");

      onClose();
    }
  };

  const txDescription = (
    <DialogContentText id={descriptionId} textAlign="center">
      {amount} {assetSymbol} from{" "}
      <Typography
        component="span"
        display="block"
        fontFamily={monospaceFontFamily}
        noWrap
      >
        {fromAddress}
      </Typography>{" "}
      to{" "}
      <Typography
        component="span"
        display="block"
        fontFamily={monospaceFontFamily}
        noWrap
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
      ) : txUrl ? (
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
              to={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ marginLeft: "8px" }}
            >
              View Transaction
            </Button>
          </DialogActions>
        </>
      ) : (
        <Box component="form" marginTop="1em" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle id={headingId} variant="h1">
            Confirm Transaction
          </DialogTitle>
          <DialogContent sx={{ padding: "1rem" }}>
            <DialogContentText>{txDescription}</DialogContentText>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              marginTop="1rem"
            >
              <TextField
                id="pin"
                type="password"
                label="Private Key PIN"
                helpText={decryptInput.shape.pin.description}
                error={errors.pin?.message ?? decryptionError}
                inputProps={{ minLength: 6, maxLength: 6 }}
                autoFocus
                {...register("pin")}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: "1rem" }}>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Send Transaction</Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  );
};
