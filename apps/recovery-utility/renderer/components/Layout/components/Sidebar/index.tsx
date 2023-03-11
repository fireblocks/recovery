import { useRouter } from 'next/router';
import { Box, Grid, lighten } from '@mui/material';
import { LeakAdd, ManageHistory, Restore, Settings, Verified } from '@mui/icons-material';
import { Glyph, Button, ButtonProps, Link, NextLinkComposed } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../../../../context/Workspace';
import { AccountsIcon, KeyIcon } from '../../../Icons';

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

export const Sidebar = () => {
  const router = useRouter();

  const { extendedKeys: { xpub, fpub, xprv, fprv } = {} } = useWorkspace();

  const hasExtendedPublicKeys = !!xpub || !!fpub;
  const hasExtendedPrivateKeys = !!xprv || !!fprv;
  const hasExtendedKeys = hasExtendedPublicKeys || hasExtendedPrivateKeys;
  const hasOnlyExtendedPublicKeys = hasExtendedPublicKeys && !hasExtendedPrivateKeys;

  const StatusIcon = hasOnlyExtendedPublicKeys ? Verified : Restore;

  const isActive = (pathname: string) => router.pathname.startsWith(pathname);

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
                Recovery Utility
              </Link>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <SidebarButton
            to='/accounts/vault'
            startIcon={<AccountsIcon active={isActive('/accounts')} />}
            color={isActive('/accounts') ? 'primary' : 'secondary'}
            disabled={!hasExtendedKeys}
          >
            Accounts
          </SidebarButton>
        </Grid>
        <Grid item xs={12}>
          <SidebarButton
            to='/relay'
            startIcon={<LeakAdd />}
            color={isActive('/relay') ? 'primary' : 'secondary'}
            disabled={!hasExtendedKeys}
          >
            Relay
          </SidebarButton>
        </Grid>
        <Grid item xs={12}>
          <SidebarButton to='/setup' startIcon={<ManageHistory />} color={isActive('/setup') ? 'primary' : 'secondary'}>
            Set Up
          </SidebarButton>
        </Grid>
        <Grid item xs={12}>
          <SidebarButton to='/verify' startIcon={<Verified />} color={isActive('/verify') ? 'primary' : 'secondary'}>
            Verify
          </SidebarButton>
        </Grid>
        <Grid item xs={12}>
          <SidebarButton
            to='/recover'
            startIcon={<Restore />}
            color={isActive('/recover') ? 'error' : 'secondary'}
            sx={{ justifyContent: 'flex-start' }}
          >
            Recover
          </SidebarButton>
        </Grid>
        <Grid item xs={12}>
          <SidebarButton
            to='/keys'
            startIcon={<KeyIcon active={isActive('/keys')} />}
            color={isActive('/keys') ? 'primary' : 'secondary'}
          >
            Extended Keys
          </SidebarButton>
        </Grid>
        <Grid item xs={12}>
          <SidebarButton to='/settings' startIcon={<Settings />} color={isActive('/settings') ? 'primary' : 'secondary'}>
            Settings
          </SidebarButton>
        </Grid>
      </Grid>
      {hasExtendedKeys && (
        <Box
          sx={(theme) => {
            const color = hasOnlyExtendedPublicKeys ? theme.palette.primary.main : theme.palette.error.main;

            return {
              color,
              border: `solid 1px ${color}`,
              background: lighten(color, 0.95),
              borderRadius: '0.5rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
            };
          }}
        >
          <StatusIcon sx={{ marginRight: '0.5rem' }} />
          {hasOnlyExtendedPublicKeys ? 'Verifying public' : 'Recovered private'} keys
        </Box>
      )}
    </Box>
  );
};
