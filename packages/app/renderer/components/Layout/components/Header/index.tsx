import { useRouter } from "next/router";
import { Box, Grid } from "@mui/material";
import { Key, Settings } from "@mui/icons-material";
import { Logo, Button, Link, NextLinkComposed } from "shared";
import { AssetsIcon } from "./components/Icons";
import { pythonServerUrlParams } from "../../../../lib/pythonClient";
import { useWorkspace } from "../../../../context/Workspace";

type Props = {
  showBack: boolean;
  hideNavigation: boolean;
};

export const Header = ({ hideNavigation, showBack }: Props) => {
  const router = useRouter();

  const { isRecovered } = useWorkspace();

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
        {!!showBack && (
          <Grid item>
            <Button variant="text" onClick={router.back}>
              Back
            </Button>
          </Grid>
        )}
        {!!isRecovered && !hideNavigation && (
          <>
            <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to={{
                  pathname: "/assets/[assetId]",
                  query: { ...pythonServerUrlParams, assetId: "BTC" },
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
                to={{
                  pathname: "/keys",
                  query: pythonServerUrlParams,
                }}
                startIcon={<Key />}
                color={isActive("/keys") ? "primary" : "secondary"}
              >
                Keys
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to={{
                  pathname: "/settings",
                  query: pythonServerUrlParams,
                }}
                startIcon={<Settings />}
                color={isActive("/settings") ? "primary" : "secondary"}
              >
                Settings
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};
