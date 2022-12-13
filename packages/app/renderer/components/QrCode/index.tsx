import { Box, BoxProps, Typography, FormControlProps } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { TextField } from "shared";

type Props = BoxProps & {
  data?: string;
  title?: string;
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
  noFieldPadding?: boolean;
  formControlProps?: FormControlProps;
};

export const QrCode = ({
  data,
  title,
  bgColor,
  fgColor,
  includeMargin = true,
  noFieldPadding,
  formControlProps,
  ...props
}: Props) => (
  <Box
    height="100%"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent={data ? "flex-start" : "center"}
    {...props}
  >
    {data ? (
      <>
        <QRCodeSVG
          value={data}
          size={512}
          bgColor={bgColor}
          fgColor={fgColor}
          includeMargin={includeMargin}
          style={{
            aspectRatio: "1",
            height: "auto",
            width: "100%",
          }}
        />
        <TextField
          id="qrCodeData"
          label={title}
          value={data}
          fullWidth
          enableCopy
          isMonospace
          formControlProps={{
            sx: { margin: noFieldPadding ? "1em 0 0 0" : "1em" },
            ...formControlProps,
          }}
        />
      </>
    ) : (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="100%"
        height="auto"
        sx={{
          aspectRatio: "1",
          background: (theme) => theme.palette.grey[300],
        }}
      >
        <Typography variant="body1">No QR code data</Typography>
      </Box>
    )}
  </Box>
);
