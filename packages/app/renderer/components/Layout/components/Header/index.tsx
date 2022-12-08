import { useRouter } from "next/router";
import { Box, Grid } from "@mui/material";
import { Key } from "@mui/icons-material";
import { Link, NextLinkComposed } from "../../../Link";
import { Button } from "../../../Button";
import { Logo } from "../../../Logo";
import { AssetsIcon } from "./components/Icons";

type Props = {
  hideNavigation: boolean;
};

export const Header = ({ hideNavigation }: Props) => {
  const router = useRouter();

  const isActive = (pathname: string) => router.pathname.startsWith(pathname);

  return (
    <Box
      component="header"
      gridArea="header"
      paddingX="1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      zIndex="2"
      sx={{ backgroundColor: "#FFFFFF" }}
    >
      <Grid container alignItems="center" spacing={2} minHeight="80px">
        <Grid item flex={1}>
          <Grid container alignItems="center" spacing={1} marginTop={0}>
            <Grid item>
              <Link
                href="/"
                sx={{ color: (theme) => theme.palette.primary.main }}
              >
                <Logo width={130} />
              </Link>
            </Grid>
            <Grid item>
              <Link
                href="/"
                underline="none"
                sx={{
                  color: (theme) => theme.palette.text.secondary,
                  fontWeight: 400,
                  position: "relative",
                  top: "-3px",
                  userSelect: "none",
                }}
              >
                Recovery Utility
              </Link>
            </Grid>
          </Grid>
        </Grid>
        {hideNavigation ? (
          <Grid item>
            <Button variant="text" onClick={router.back}>
              Back
            </Button>
          </Grid>
        ) : (
          <>
            <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to={{
                  pathname: "/assets/[assetId]",
                  query: { assetId: "BTC" },
                }}
                startIcon={<AssetsIcon active={isActive("/assets")} />}
                color={isActive("/assets") ? "primary" : "secondary"}
              >
                Assets
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to="/keys"
                startIcon={<Key />}
                color={isActive("/keys") ? "primary" : "secondary"}
              >
                Keys
              </Button>
            </Grid>
            {/* <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to="/settings"
                startIcon={<Settings />}
                color={isActive("/settings") ? "primary" : "secondary"}
              >
                Settings
              </Button>
            </Grid> */}
          </>
        )}
      </Grid>
    </Box>
  );
};
