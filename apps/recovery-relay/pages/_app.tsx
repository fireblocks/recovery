import type { AppProps as NextAppProps } from 'next/app';
import type { EmotionCache } from '@emotion/react';
import { ErrorBoundary, SharedProviders } from '@fireblocks/recovery-shared';
import { WorkspaceProvider } from '../context/Workspace';
import { Layout } from '../components/Layout';

type AppProps = NextAppProps & {
  emotionCache?: EmotionCache;
};

export default function App({ Component, emotionCache, pageProps }: AppProps) {
  return (
    <SharedProviders emotionCache={emotionCache}>
      <WorkspaceProvider>
        <ErrorBoundary>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ErrorBoundary>
      </WorkspaceProvider>
    </SharedProviders>
  );
}
