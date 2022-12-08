import { ReactNode } from "react";
import { Box } from "@mui/material";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { CloudOutlined } from "@mui/icons-material";
import { useConnectionTest } from "../../context/ConnectionTest";

type Props = {
  children: ReactNode;
  hideHeader?: boolean;
  hideNavigation?: boolean;
  hideSidebar?: boolean;
};

const area = (...areas: string[]) => `"${areas.join(" ")}"`;

export const Layout = ({
  children,
  hideHeader = false,
  hideNavigation = false,
  hideSidebar = false,
}: Props) => {
  const { isOnline } = useConnectionTest();

  const areaWithSidebar = (mainArea: string) =>
    area(hideSidebar ? mainArea : "sidebar", mainArea);

  const gridTemplateAreas: string[] = [];

  if (isOnline) {
    gridTemplateAreas.push(area("notice", "notice"));
  }

  gridTemplateAreas.push(
    area("header", "header"),
    areaWithSidebar("main"),
    areaWithSidebar("footer")
  );

  return (
    <Box
      height="100%"
      display="grid"
      gridTemplateColumns="200px calc(100vw - 200px)"
      gridTemplateRows={`${isOnline ? "min-content " : ""}64px 1fr min-content`}
      gridTemplateAreas={gridTemplateAreas.join(" ")}
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
      {!hideHeader && <Header hideNavigation={hideNavigation} />}
      {!hideSidebar && <Sidebar />}
      <Box component="main" gridArea="main" padding="1em" overflow="auto">
        {children}
      </Box>
      <Footer />
    </Box>
  );
};
