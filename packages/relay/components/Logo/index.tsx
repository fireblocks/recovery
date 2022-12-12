import { Typography, Grid, GridProps } from "@mui/material";
import { Logo as LogoSvg } from "shared";

export const Logo = ({ color, ...props }: GridProps) => (
  <Grid
    container
    spacing={1}
    alignItems="center"
    justifyContent="center"
    color={color ?? ((theme) => theme.palette.primary.main)}
    {...props}
  >
    <Grid item>
      <LogoSvg width={130} />
    </Grid>
    <Grid item>
      <Typography
        variant="h1"
        fontSize="18px"
        margin="0 0 0.3rem 0"
        color={color}
      >
        Recovery Relay
      </Typography>
    </Grid>
  </Grid>
);
