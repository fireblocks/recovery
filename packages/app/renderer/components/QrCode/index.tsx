import { Box, BoxProps, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { TextField } from "styles";

type Props = BoxProps & {
  data?: string;
  title?: string;
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
  noFieldPadding?: boolean;
};

export const QrCode = ({
  data,
  title,
  bgColor,
  fgColor,
  includeMargin = true,
  noFieldPadding,
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
        <Box width="100%" padding={noFieldPadding ? "1em 0 0 0" : "1em"}>
          <TextField
            id="qrCodeData"
            label={title}
            value={data}
            enableCopy
            isMonospace
          />
        </Box>
      </>
    ) : (
      <Typography variant="body1">No data</Typography>
    )}
  </Box>
);
