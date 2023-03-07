import { ReactNode } from "react";
import { Box } from "@mui/material";
import { CloudOutlined } from "@mui/icons-material";
import { Header } from "./components/Header";
import { useConnectionTest } from "../../context/ConnectionTest";

type Props = {
  children: ReactNode;
  showBack?: boolean;
  hideHeader?: boolean;
  hideNavigation?: boolean;
};

export const Layout = ({
  children,
  showBack = false,
  hideHeader = false,
  hideNavigation = false,
}: Props) => {
  const { isOnline } = useConnectionTest();

  return (
    <Box
      height="100%"
      display="grid"
      gridTemplateColumns="100vw"
      gridTemplateRows={`${isOnline ? "min-content " : ""}64px 1fr`}
      gridTemplateAreas={`${isOnline ? '"notice" ' : ""} "header" "main"`}
    >
      {isOnline && (
        <Box
          component="aside"
          gridArea="notice"
          padding="0.5em 1em"
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          color="#FFF"
          zIndex="2"
          sx={{ backgroundColor: (theme) => theme.palette.error.main }}
        >
          <CloudOutlined sx={{ marginRight: "0.5rem" }} />
          This machine is connected to a network. Please disconnect.
        </Box>
      )}
      {!hideHeader && (
        <Header showBack={showBack} hideNavigation={hideNavigation} />
      )}
      <Box component="main" gridArea="main" padding="1em" overflow="auto">
        {children}
      </Box>
    </Box>
  );
};
