import { useState, ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps as NextAppProps } from "next/app";
import Head from "next/head";
import { useRouter, NextRouter } from "next/router";
import { EmotionCache } from "@emotion/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { theme, StylesProvider } from "shared";
import { WalletProvider } from "../context/Wallet";
import { ErrorBoundary } from "../components/ErrorBoundary";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement, router: NextRouter) => ReactNode;
};

type AppProps = NextAppProps & {
  Component: NextPageWithLayout;
  emotionCache?: EmotionCache;
};

const title = "Fireblocks Recovery Relay";
const description = "Make transactions from your recovered Fireblocks wallets";

const icons = [32, 180, 192, 270].reduce(
  (acc, size) => ({ ...acc, [size]: `/icons/${size}x${size}.png` }),
  {} as Record<number, string>
);

export default function App({ Component, emotionCache, pageProps }: AppProps) {
  const router = useRouter();

  const [queryClient] = useState(() => new QueryClient());

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <QueryClientProvider client={queryClient}>
      <StylesProvider emotionCache={emotionCache}>
        <WalletProvider>
          <Head>
            <title>{title}</title>
            <meta
              name="viewport"
              content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
            />
            <meta name="robots" content="noindex, nofollow" />
            <meta name="description" content={description} />
            <meta property="og:locale" content="en_US" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content={title} />
            <meta
              property="og:image"
              content="https://www.fireblocks.com/wp-content/uploads/2020/10/Fireboocks-Open-Graph@1x.jpg"
            />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:type" content="image/jpeg" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@FireblocksHQ" />
            <meta name="theme-color" content={theme.palette.primary.main} />
            <meta
              name="msapplication-TileColor"
              content={theme.palette.primary.main}
            />
            <meta name="msapplication-TileImage" content={icons[270]} />
            <meta name="mobile-web-app-capable" content="yes" />
            <link rel="manifest" href="/site.webmanifest" />
            <link rel="icon" href={icons[32]} sizes="32x32" />
            <link rel="icon" href={icons[192]} sizes="192x192" />
            <link rel="apple-touch-icon" href={icons[180]} />
          </Head>
          <ErrorBoundary>
            {getLayout(<Component {...pageProps} />, router)}
          </ErrorBoundary>
        </WalletProvider>
      </StylesProvider>
    </QueryClientProvider>
  );
}
