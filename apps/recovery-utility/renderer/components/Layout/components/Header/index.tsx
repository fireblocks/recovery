import { useRouter } from "next/router";
import { Box, Grid } from "@mui/material";
import { Settings } from "@mui/icons-material";
import {
  Logo,
  Button,
  Link,
  NextLinkComposed,
} from "@fireblocks/recovery-shared";
import { AccountsIcon, KeyIcon } from "../../../Icons";
import { useWorkspace } from "../../../../context/Workspace";

type Props = {
  showBack: boolean;
  hideNavigation: boolean;
};

export function Header({ hideNavigation, showBack }: Props) {
  const router = useRouter();

  const { extendedKeys, reset } = useWorkspace();

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
                onClick={reset}
                sx={{ color: (theme) => theme.palette.primary.main }}
              >
                <Logo width={130} />
              </Link>
            </Grid>
            <Grid item>
              <Link
                href="/"
                onClick={reset}
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
        {!!extendedKeys && !hideNavigation && (
          <>
            <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to="/accounts/vault"
                startIcon={<AccountsIcon active={isActive("/accounts")} />}
                color={isActive("/accounts") ? "primary" : "secondary"}
              >
                Accounts
              </Button>
            </Grid>
            {/* <Grid item>
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
            </Grid> */}
            <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to="/keys"
                startIcon={<KeyIcon active={isActive("/keys")} />}
                color={isActive("/keys") ? "primary" : "secondary"}
              >
                Keys
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="text"
                component={NextLinkComposed}
                to="/settings"
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
}
