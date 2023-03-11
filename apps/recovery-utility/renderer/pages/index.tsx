import { ReactNode } from 'react';
import { Grid, Typography, SxProps } from '@mui/material';
import { LeakAdd, ManageHistory, Restore, Verified, Warning } from '@mui/icons-material';
import { Button, NextLinkComposed } from '@fireblocks/recovery-shared';
import type { NextPageWithLayout } from './_app';
import { useWorkspace } from '../context/Workspace';
import { Layout } from '../components/Layout';
import { KeyIcon, VaultAccountIcon } from '../components/Icons';

const buttonStyles: SxProps = {
  padding: '0.2rem',
  height: '100%',
  aspectRatio: '1 / 1',
  textAlign: 'center',
  flexDirection: 'column',
  borderWidth: '2px',
  ':hover': {
    borderWidth: '2px',
  },
};

const iconStyles: SxProps = { marginBottom: '1rem', fontSize: '4rem' };

type BoxButtonProps = {
  icon: typeof KeyIcon | typeof Restore | typeof ManageHistory | typeof Verified | typeof Warning;
  title: ReactNode;
  description: ReactNode;
  color: 'primary' | 'error';
  href: string;
  disabled?: boolean;
};

const BoxButton = ({ icon: Icon, title, description, color = 'primary', href, disabled }: BoxButtonProps) => (
  <Button
    component={NextLinkComposed}
    to={href}
    size='large'
    variant='outlined'
    color={color}
    fullWidth
    disabled={disabled}
    sx={buttonStyles}
  >
    <Icon sx={iconStyles} />
    <Typography fontWeight='600' fontSize='1rem'>
      {title}
    </Typography>
    <Typography variant='caption' color={(theme) => theme.palette.grey[700]}>
      {description}
    </Typography>
  </Button>
);

const Index: NextPageWithLayout = () => {
  const { extendedKeys: { xpub, fpub, xprv, fprv } = {} } = useWorkspace();

  const hasExtendedKeys = !!xpub || !!fpub || !!xprv || !!fprv;

  return (
    <Grid container justifyContent='center' alignItems='center' height='100%' padding='rem'>
      <Grid item xs={11}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant='h2' marginBottom='0'>
              Prepare for Recovery
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <BoxButton
              icon={ManageHistory}
              title='Set Up Recovery Kit'
              description='Back up your Workspace'
              color='primary'
              href='/setup'
            />
          </Grid>
          <Grid item xs={4}>
            <BoxButton
              icon={Verified}
              title='Verify Recovery Kit'
              description='Test recovery process'
              color='primary'
              href='/verify'
            />
          </Grid>
          <Grid item xs={4}>
            <BoxButton
              icon={KeyIcon}
              title='Verify Public Keys'
              description='Test extended public keys'
              color='primary'
              href='/keys'
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant='h2' marginBottom='0'>
              Recover Workspace
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <BoxButton icon={Restore} title='Recover Private Keys' description='Use Recovery Kit' color='error' href='/recover' />
          </Grid>
          <Grid item xs={4}>
            <BoxButton
              icon={VaultAccountIcon}
              title='Recover Vault'
              description='Add Vault Accounts & wallets'
              color='primary'
              href='/accounts/vault'
              disabled={!hasExtendedKeys}
            />
          </Grid>
          <Grid item xs={4}>
            <BoxButton
              icon={LeakAdd}
              title='Connect Wallets'
              description='Query balances & transfer'
              color='primary'
              href='/relay'
              disabled={!hasExtendedKeys}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

Index.getLayout = (page) => <Layout>{page}</Layout>;

export default Index;
