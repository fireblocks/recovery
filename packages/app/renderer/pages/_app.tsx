import { useState, ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps as NextAppProps } from "next/app";
import Head from "next/head";
import { useRouter, NextRouter } from "next/router";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { CacheProvider, EmotionCache } from "@emotion/react";
import log from "electron-log";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { theme } from "../lib/theme";
import { createEmotionCache } from "../lib/createEmotionCache";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ConnectionTestProvider } from "../context/ConnectionTest";
import { WorkspaceProvider } from "../context/Workspace";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement, router: NextRouter) => ReactNode;
};

type AppProps = NextAppProps & {
  Component: NextPageWithLayout;
  emotionCache?: EmotionCache;
};

// Override console.log with electron-log
Object.assign(console, log.functions);

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function App({
  Component,
  emotionCache = clientSideEmotionCache,
  pageProps,
}: AppProps) {
  const router = useRouter();

  const [queryClient] = useState(() => new QueryClient());

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider value={emotionCache}>
        <ConnectionTestProvider>
          <WorkspaceProvider>
            <Head>
              <title>Fireblocks Recovery Utility</title>
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
              />
            </Head>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <ErrorBoundary>
                {getLayout(<Component {...pageProps} />, router)}
              </ErrorBoundary>
            </ThemeProvider>
          </WorkspaceProvider>
        </ConnectionTestProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
}
