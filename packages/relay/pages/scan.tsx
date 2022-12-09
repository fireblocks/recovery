import type { NextPageWithLayout } from "./_app";
import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Result } from "@zxing/library";
import { useWallet } from "../context/Wallet";
import { Logo } from "../components/Logo";
import { QrReader } from "../components/QrReader";

const getHashFromCodeUrl = (result: Result) => result?.getText().split("#")[1];

const Scan: NextPageWithLayout = () => {
  const { handleUrlPayload } = useWallet();

  const [scanError, setScanError] = useState<string | undefined>(undefined);

  const onQrCodeResult = (result: Result) => {
    try {
      handleUrlPayload(getHashFromCodeUrl(result));

      setScanError(undefined);
    } catch {
      setScanError("Invalid Recovery Relay URL in QR code");
    }
  };

  return (
    <Box height="100%">
      <Box
        position="absolute"
        width="100%"
        top="0"
        left="0"
        padding="1.25em 1em 1em 1em"
        textAlign="center"
        color="#FFF"
        zIndex="2"
        sx={{ backgroundColor: (theme) => theme.palette.primary.main }}
      >
        <Logo />
        <Typography
          variant="body1"
          color={scanError ? (theme) => theme.palette.error.main : undefined}
        >
          {scanError ??
            "Start a withdrawal from a Fireblocks Recovery Utility wallet, then scan the code."}
        </Typography>
      </Box>
      <QrReader
        onValidate={(result) => !!getHashFromCodeUrl(result)}
        onResult={onQrCodeResult}
        onError={(error) => console.error(error)}
      />
    </Box>
  );
};

export default Scan;
