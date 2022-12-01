import { useState, ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps as NextAppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { CacheProvider, EmotionCache } from "@emotion/react";
import log from "electron-log";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { ipcLink } from "../lib/ipcLink";
import { trpc } from "../lib/trpc";
import { theme } from "../lib/theme";
import { createEmotionCache } from "../lib/createEmotionCache";
import { ErrorBoundary } from "../components/ErrorBoundary";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
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
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [ipcLink()] })
  );

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <CacheProvider value={emotionCache}>
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
              {getLayout(<Component {...pageProps} />)}
            </ErrorBoundary>
          </ThemeProvider>
        </CacheProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
