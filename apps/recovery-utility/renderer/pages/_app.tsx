import type { AppProps as NextAppProps } from 'next/app';
import { EmotionCache } from '@emotion/react';
import log from 'electron-log';
import { ErrorBoundary, SharedProviders } from '@fireblocks/recovery-shared';
import { SettingsProvider } from '../context/Settings';
import { ConnectionTestProvider } from '../context/ConnectionTest';
import { WorkspaceProvider } from '../context/Workspace';
import { Layout } from '../components/Layout';

type AppProps = NextAppProps & {
  emotionCache?: EmotionCache;
};

// Temporarily using @ts-ignore since TypeScript and React are not in sync

// Override console.log with electron-log
Object.assign(console, log.functions);

export default function App({ Component, emotionCache, pageProps }: AppProps) {
  return (
    <SharedProviders emotionCache={emotionCache}>
      <SettingsProvider>
        <ConnectionTestProvider>
          <WorkspaceProvider>
            {/* @ts-ignore */}
            <ErrorBoundary>
              <Layout>
                {/* @ts-ignore */}
                <Component {...pageProps} />
              </Layout>
            </ErrorBoundary>
          </WorkspaceProvider>
        </ConnectionTestProvider>
      </SettingsProvider>
    </SharedProviders>
  );
}
