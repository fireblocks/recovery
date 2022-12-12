import React, { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { createEmotionCache } from "../../lib/createEmotionCache";
import { theme } from "../../theme";

type Props = {
  emotionCache?: EmotionCache;
  children: ReactNode;
};

const clientSideEmotionCache = createEmotionCache();

export const StylesProvider = ({
  emotionCache = clientSideEmotionCache,
  children,
}: Props) => (
  <CacheProvider value={emotionCache}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </CacheProvider>
);
