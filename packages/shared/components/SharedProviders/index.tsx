import React, { useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from '@mui/material/styles';
import { StylesProvider } from '@mui/styles';
import { CssBaseline } from '@mui/material';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { createEmotionCache } from '../../lib/createEmotionCache';
import { theme } from '../../theme';

type Props = {
  emotionCache?: EmotionCache;
  children: ReactNode;
};

const clientSideEmotionCache = createEmotionCache();

export function SharedProviders({ emotionCache = clientSideEmotionCache, children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          <StylesProvider injectFirst>
            <CssBaseline />
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
            {children}
          </StylesProvider>
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
}
