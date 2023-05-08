import React, { ReactNode } from 'react';
import Head from 'next/head';
import { darken, Box, SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';
import { Sidebar, Props as SidebarProps } from './components/Sidebar';

export type { StatusBoxProps } from './components/Sidebar';

export type LayoutProps = SidebarProps & {
  description: string;
  notice?: ReactNode;
  noticeLevel?: 'error' | 'warning' | 'info' | 'success';
  children: ReactNode;
};

const errorNoticeSx: SxProps<Theme> = (t) => ({
  backgroundImage: `repeating-linear-gradient(45deg, ${darken(t.palette.error.main, 0.1)}, ${darken(
    t.palette.error.main,
    0.1,
  )} 1rem, ${t.palette.error.main} 1rem, ${t.palette.error.main} 2rem)`,
  backgroundSize: '200% 100%',
  animation: 'barberpole 30s linear infinite',
  '@keyframes barberpole': {
    from: {
      backgroundPosition: 'right',
    },
    to: {
      backgroundPosition: 'left',
    },
  },
});

const icons = [32, 180, 192, 270].reduce(
  (acc, size) => ({ ...acc, [size]: `/icons/${size}x${size}.png` }),
  {} as Record<number, string>,
);

export const Layout = ({ children, title, description, navLinks, status, notice, noticeLevel = 'info' }: LayoutProps) => {
  const fullTitle = `Fireblocks ${title}`;

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta
          name='viewport'
          content='minimum-scale=1, maximum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover'
        />
        <meta name='robots' content='noindex, nofollow' />
        <meta name='description' content={description} />
        <meta property='og:locale' content='en_US' />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={fullTitle} />
        <meta property='og:description' content={description} />
        <meta property='og:site_name' content={fullTitle} />
        <meta property='og:image' content='https://www.fireblocks.com/wp-content/uploads/2020/10/Fireboocks-Open-Graph@1x.jpg' />
        <meta property='og:image:width' content='1200' />
        <meta property='og:image:height' content='630' />
        <meta property='og:image:type' content='image/jpeg' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@FireblocksHQ' />
        <meta name='theme-color' content={theme.palette.primary.main} />
        <meta name='msapplication-TileColor' content={theme.palette.primary.main} />
        <meta name='msapplication-TileImage' content={icons[270]} />
        <meta name='mobile-web-app-capable' content='yes' />
        <link rel='manifest' href='/site.webmanifest' />
        <link rel='icon' href={icons[32]} sizes='32x32' />
        <link rel='icon' href={icons[192]} sizes='192x192' />
        <link rel='apple-touch-icon' href={icons[180]} />
      </Head>
      <Box
        height='100%'
        display='grid'
        gridTemplateColumns='225px 1fr'
        gridTemplateRows={`${notice ? 'min-content ' : ''} 1fr`}
        gridTemplateAreas={`${notice ? '"notice notice" ' : ''} "sidebar main"`}
      >
        {!!notice && (
          <Box
            component='aside'
            gridArea='notice'
            padding='0.5em 1em'
            display='flex'
            alignItems='center'
            justifyContent='center'
            textAlign='center'
            fontWeight='600'
            color='#FFF'
            zIndex='2'
            sx={(t) => ({
              ...(noticeLevel === 'error' ? errorNoticeSx(t) : { backgroundColor: t.palette[noticeLevel].main }),
            })}
          >
            {notice}
          </Box>
        )}
        <Sidebar title={title} navLinks={navLinks} status={status} />
        <Box component='main' gridArea='main' padding='1em' overflow='auto'>
          {children}
        </Box>
      </Box>
    </>
  );
};
