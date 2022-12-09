import { Typography, Grid, GridProps } from "@mui/material";
import { Logo as LogoSvg } from "styles";

export const Logo = (props: GridProps) => (
  <Grid
    container
    spacing={1}
    alignItems="center"
    justifyContent="center"
    {...props}
  >
    <Grid item>
      <LogoSvg width={130} />
    </Grid>
    <Grid item>
      <Typography variant="h1" fontSize="18px" margin="0 0 0.3rem 0">
        Recovery Relay
      </Typography>
    </Grid>
  </Grid>
);
