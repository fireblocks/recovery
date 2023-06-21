import React, { ComponentType } from 'react';
import { useRouter } from 'next/router';
import { Box, Grid, SxProps, Theme } from '@mui/material';
import type { SvgIcon } from '@mui/material';
import { Button, ButtonProps } from '../../../Button';
import { Glyph } from '../../../Glyph';
import { Link, NextLinkComposed } from '../../../Link';

const SidebarButton = ({ sx, disabled, ...props }: ButtonProps) => (
  <Button
    {...props}
    component={NextLinkComposed}
    variant='text'
    fullWidth
    disabled={disabled}
    sx={{ ...sx, justifyContent: 'flex-start', ...(disabled ? { border: 'none !important', padding: '6px 8px 6px 8px' } : {}) }}
  />
);

export type StatusBoxProps = {
  icon: ComponentType<{ sx?: SxProps<Theme> }>;
  text: string;
};

export type Props = {
  title: string;
  navLinks: ({ label: string; path: string; icon: typeof SvgIcon | ComponentType<{ active?: boolean }> } & Omit<
    ButtonProps,
    'title'
  >)[];
};

export const Sidebar = ({ title, navLinks }: Props) => {
  const router = useRouter();

  const isActive = (pathname: string) => router.pathname.startsWith(pathname);

  const buttonColor = (pathname: string, primaryColor: ButtonProps['color'] = 'primary') =>
    isActive(pathname) ? primaryColor : 'secondary';

  return (
    <Box
      component='aside'
      gridArea='sidebar'
      padding='1em'
      display='flex'
      justifyContent='space-between'
      flexDirection='column'
      zIndex='2'
      sx={{ backgroundColor: '#FFF' }}
    >
      <Grid container alignItems='flex-start' spacing={2}>
        <Grid item xs={12} marginY='0.5rem'>
          <Grid container alignItems='center' marginTop={0}>
            <Grid item margin='0 0.5rem 0 0.15rem'>
              <Link href='/' sx={{ color: (theme) => theme.palette.primary.main }}>
                <Glyph width={20} />
              </Link>
            </Grid>
            <Grid item>
              <Link
                href='/'
                underline='none'
                sx={{
                  color: '#000',
                  fontWeight: 400,
                  fontSize: '1rem',
                  position: 'relative',
                  top: '-3px',
                  userSelect: 'none',
                }}
              >
                {title}
              </Link>
            </Grid>
          </Grid>
        </Grid>
        {navLinks.map(({ label, path, icon: Icon, color, disabled }) => (
          <Grid item xs={12} key={path}>
            <SidebarButton
              to={path}
              startIcon={<Icon active={isActive(path)} />}
              color={buttonColor(path, color)}
              disabled={disabled}
            >
              {label}
            </SidebarButton>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
