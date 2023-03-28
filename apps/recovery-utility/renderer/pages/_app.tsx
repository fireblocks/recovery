import { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps as NextAppProps } from 'next/app';
import Head from 'next/head';
import { useRouter, NextRouter } from 'next/router';
import { EmotionCache } from '@emotion/react';
import log from 'electron-log';
import { SharedProviders } from '@fireblocks/recovery-shared';
import { SettingsProvider } from '../context/Settings';
import { ConnectionTestProvider } from '../context/ConnectionTest';
import { WorkspaceProvider } from '../context/Workspace';
import { ErrorBoundary } from '../components/ErrorBoundary';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement, router: NextRouter) => ReactNode;
};

type AppProps = NextAppProps & {
  Component: NextPageWithLayout;
  emotionCache?: EmotionCache;
};

// Override console.log with electron-log
Object.assign(console, log.functions);

export default function App({ Component, emotionCache, pageProps }: AppProps) {
  const router = useRouter();

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <SharedProviders emotionCache={emotionCache}>
      <SettingsProvider>
        <ConnectionTestProvider>
          <WorkspaceProvider>
            <Head>
              <title>Fireblocks Recovery Utility</title>
              <meta name='viewport' content='width=device-width, initial-scale=1' />
            </Head>
            <ErrorBoundary>{getLayout(<Component {...pageProps} />, router)}</ErrorBoundary>
          </WorkspaceProvider>
        </ConnectionTestProvider>
      </SettingsProvider>
    </SharedProviders>
  );
}