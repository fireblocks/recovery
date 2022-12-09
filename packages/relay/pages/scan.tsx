import type { NextPageWithLayout } from "./_app";
import { Box, Typography, alpha } from "@mui/material";
import { Result } from "@zxing/library";
import { useWallet } from "../context/Wallet";
import { Logo } from "../components/Logo";
import { QrReader } from "../components/QrReader";

const handleValidation = (result: Result) => {
  const data = result?.getText();

  const origin = "http://localhost:3000"; // window.location.origin;

  return data?.startsWith(origin);
};

const Scan: NextPageWithLayout = () => {
  const { handleUrlPayload } = useWallet();

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
        sx={{
          backgroundColor: alpha("#000", 0.5),
          backdropFilter: "blur(15px)",
        }}
      >
        <Logo />
        <Typography variant="body1">
          Start a withdrawal from a Fireblocks Recovery Utility wallet, then
          scan the code.
        </Typography>
      </Box>
      <QrReader
        onValidate={handleValidation}
        onResult={(result) => {
          const isValid = handleValidation(result);

          console.info({ result, isValid });

          if (isValid) {
            handleUrlPayload(result.getText().split("#")[1]);
          } else {
            alert("Invalid QR code");
          }
        }}
        onError={(error) => console.error(error)}
      />
    </Box>
  );
};

export default Scan;
