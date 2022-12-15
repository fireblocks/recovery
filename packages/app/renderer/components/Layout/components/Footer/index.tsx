import { Box, BoxProps, Typography } from "@mui/material";

type Props = BoxProps;

export const Footer = (props: Props) => (
  <Box
    component="footer"
    gridArea="footer"
    padding="0.5em 1em"
    sx={{ backgroundColor: "#FFF" }}
    {...props}
  >
    <Typography variant="body2" color="text.secondary">
      Fireblocks
      {" © "}
      {new Date().getFullYear()}. NMLS Registration Number: 2066055
    </Typography>
  </Box>
);
