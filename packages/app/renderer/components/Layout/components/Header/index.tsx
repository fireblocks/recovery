import { useRouter } from "next/router";
import { Box, Grid, IconButton } from "@mui/material";
import { Refresh, Settings } from "@mui/icons-material";
import { Link, NextLinkComposed } from "../../../Link";
import { Logo } from "./components/Logo";

export const Header = () => {
  const router = useRouter();

  // TODO
  const isAuthenticated = false;

  const isActive = (pathname: string) => router.pathname.startsWith(pathname);

  return (
    <Box
      component="header"
      gridArea="header"
      paddingX="1em"
      display="flex"
      flexDirection="column"
      alignItems="center"
      zIndex={2}
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
        {isAuthenticated && (
          <>
            <Grid item>
              <IconButton
                component={NextLinkComposed}
                to="/settings"
                color={isActive("/settings") ? "primary" : "secondary"}
                aria-label="Settings"
              >
                <Settings />
              </IconButton>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};
