import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useCallback, ReactElement } from "react";
import {
  Box,
  Grid,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { theme } from "../lib/theme";
import { TextField } from "../components/TextField";

const QR = () => {
  const router = useRouter();

  const data = router.query.data as string | undefined;
  const title = router.query.title as string | undefined;

  return (
    <Box
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent={data ? "flex-start" : "center"}
    >
      <Head>
        <title>{`${title ? `${title} ` : ""} QR Code`}</title>
      </Head>
      {data ? (
        <>
          <QRCodeSVG
            value={data}
            size={512}
            fgColor={theme.palette.primary.main}
            style={{
              background: "#FFF",
              aspectRatio: "1",
              height: "auto",
              width: "100%",
            }}
            includeMargin={false}
          />
          <Box width="100%" padding="1rem">
            <TextField id="qrCodeData" label={title} value={data} enableCopy />
          </Box>
        </>
      ) : (
        <Typography variant="body1">No data</Typography>
      )}
    </Box>
  );
};

export default QR;
