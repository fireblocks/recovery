import type { AppProps as NextAppProps } from 'next/app';
import type { EmotionCache } from '@emotion/react';
import { ErrorBoundary, SharedProviders } from '@fireblocks/recovery-shared';
import { WorkspaceProvider } from '../context/Workspace';
import { Layout } from '../components/Layout';

type AppProps = NextAppProps & {
  emotionCache?: EmotionCache;
};

// Temporarily using @ts-ignore since TypeScript and React are not in sync

export default function App({ Component, emotionCache, pageProps }: AppProps) {
  return (
    <SharedProviders emotionCache={emotionCache}>
      <WorkspaceProvider>
        {/* @ts-ignore */}
        <ErrorBoundary>
          <Layout>
            {/* @ts-ignore */}
            <Component {...pageProps} />
          </Layout>
        </ErrorBoundary>
      </WorkspaceProvider>
    </SharedProviders>
  );
}
