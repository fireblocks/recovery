import type { NextPageWithLayout } from "./_app";
import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useWallet } from "../context/Wallet";
import { Logo } from "../components/Logo";
import { QrCodeScanner, ScanResult } from "../components/QrCodeScanner";

const Scan: NextPageWithLayout = () => {
  const { handleUrlPayload } = useWallet();

  const [scanError, setScanError] = useState<string | undefined>(undefined);

  const onQrDecode = ({ data }: ScanResult) => {
    try {
      const hash = data.split("#")[1];

      handleUrlPayload(hash);

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
        zIndex="4"
        sx={{ backgroundColor: (theme) => theme.palette.primary.main }}
      >
        <Logo color="#FFF" />
        <Typography variant="body1">
          {scanError ??
            "Start a withdrawal from a Fireblocks Recovery Utility wallet, then scan the code."}
        </Typography>
      </Box>
      <QrCodeScanner onDecode={onQrDecode} />
    </Box>
  );
};

export default Scan;
