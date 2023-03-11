import { useRouter } from 'next/router';
import { Box, Grid, lighten } from '@mui/material';
import { LeakAdd, ManageHistory, Restore, Settings, Verified } from '@mui/icons-material';
import { Glyph, Button, Link, NextLinkComposed } from '@fireblocks/recovery-shared';
import { useWorkspace } from '../../../../context/Workspace';
import { AccountsIcon, KeyIcon } from '../../../Icons';

export const Sidebar = () => {
  const router = useRouter();

  const { extendedKeys } = useWorkspace();

  const hasExtendedKeys =
    !!extendedKeys && (!!extendedKeys.xpub || !!extendedKeys.fpub || !!extendedKeys.xprv || !!extendedKeys.fprv);

  const hasExtendedPublicKeys = hasExtendedKeys && (extendedKeys.xpub || extendedKeys.fpub);
  const hasExtendedPrivateKeys = hasExtendedKeys && (extendedKeys.xprv || extendedKeys.fprv);
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
        {hasExtendedKeys && (
          <>
            <Grid item xs={12}>
              <Button
                variant='text'
                component={NextLinkComposed}
                to='/accounts/vault'
                startIcon={<AccountsIcon active={isActive('/accounts')} />}
                color={isActive('/accounts') ? 'primary' : 'secondary'}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Accounts
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant='text'
                component={NextLinkComposed}
                to='/relay'
                startIcon={<LeakAdd />}
                color={isActive('/relay') ? 'primary' : 'secondary'}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Relay
              </Button>
            </Grid>
          </>
        )}
        <Grid item xs={12}>
          <Button
            variant='text'
            component={NextLinkComposed}
            to='/setup'
            startIcon={<ManageHistory />}
            color={isActive('/setup') ? 'primary' : 'secondary'}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Set Up
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant='text'
            component={NextLinkComposed}
            to='/verify'
            startIcon={<Verified />}
            color={isActive('/verify') ? 'primary' : 'secondary'}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Verify
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant='text'
            component={NextLinkComposed}
            to='/recover'
            startIcon={<Restore />}
            color={isActive('/recover') ? 'error' : 'secondary'}
            sx={{ justifyContent: 'flex-start' }}
            fullWidth
          >
            Recover
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant='text'
            component={NextLinkComposed}
            to='/keys'
            startIcon={<KeyIcon active={isActive('/keys')} />}
            color={isActive('/keys') ? 'primary' : 'secondary'}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Extended Keys
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant='text'
            component={NextLinkComposed}
            to='/settings'
            startIcon={<Settings />}
            color={isActive('/settings') ? 'primary' : 'secondary'}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Settings
          </Button>
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
