import { ReactNode, useEffect } from 'react';
import { Grid, Typography, SxProps, CircularProgress, Box } from '@mui/material';
import { ImportExport, ManageHistory, Restore, Verified, Warning, LeakAdd } from '@mui/icons-material';
import { Button, NextLinkComposed, KeyIcon, VaultAccountIcon, getLogger, useWrappedState } from '@fireblocks/recovery-shared';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';
import { useWorkspace } from '../context/Workspace';
import { getDeployment, useDeployment } from '../lib/ipc';
import { resetDeployment } from '../lib/ipc/useDeployment';
import { resetLogs } from '../lib/ipc/getLogs';

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
  href?: string;
  disabled?: boolean;
  onClick?: VoidFunction;
};

export const BoxButton = ({ icon: Icon, title, description, color = 'primary', href, disabled, onClick }: BoxButtonProps) => (
  <Button
    {...(href ? { to: href, component: NextLinkComposed } : {})}
    size='large'
    variant='outlined'
    color={color}
    fullWidth
    disabled={disabled}
    sx={buttonStyles}
    onClick={onClick}
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

const Index = () => {
  const { getExtendedKeysForAccountId } = useWorkspace();

  const logger = getLogger(LOGGER_NAME_UTILITY);

  const { xpub, fpub, xprv, fprv } = getExtendedKeysForAccountId(0) || {};
  const hasExtendedKeys = !!xpub || !!fpub || !!xprv || !!fprv;

  const [loading, setLoading] = useWrappedState<boolean>('util-loading', true);
  const [protocol, setProtocol] = useWrappedState<'UTILITY' | 'RELAY' | null>('util-protocol', null);

  const onClickDeployment = async (_protocol: 'UTILITY' | 'RELAY') => {
    // resetLogs();
    logger.debug(`Setting deployment ${_protocol}`);
    useDeployment(_protocol);
  };

  useEffect(
    () =>
      void getDeployment().then((deployment) => {
        logger.debug(`Using deployment ${JSON.stringify(deployment)}`);
        const protocol = deployment.exp && deployment.exp > Date.now() ? deployment.protocol : null;
        if (protocol === null) {
          resetDeployment();
        }
        setLoading(false);
        setProtocol(protocol);
      }),
    [],
  );

  if (loading) {
    return (
      <Box display='flex' alignItems='center' justifyContent='center' height='100%'>
        <CircularProgress
          size='48px'
          color='primary'
          sx={(theme) => ({
            color: theme.palette.primary.main,
            marginTop: '-24px',
            marginLeft: '-24px',
          })}
        />
      </Box>
    );
  }

  if (!protocol) {
    return (
      <Grid container justifyContent='center' alignItems='center' height='100%' padding='0.5rem'>
        <Grid item xs={11}>
          <Grid container spacing={2} display='flex' alignItems='center' justifyContent='center'>
            <Grid item xs={12}>
              <Typography variant='h2' marginBottom='0' textAlign='center'>
                Fireblocks Recovery Configuration
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <BoxButton
                icon={Restore}
                title='Use the Recovery Utility'
                description={
                  <>
                    Prepare, verify, and perform workspace recovery.
                    <br />
                    ONLY USE ON AN OFFLINE, AIR-GAPPED MACHINE!
                  </>
                }
                color='error'
                onClick={() => onClickDeployment('UTILITY')}
              />
            </Grid>
            <Grid item xs={4}>
              <BoxButton
                icon={LeakAdd}
                title='Use the Recovery Relay'
                description='Securely withdraw from recovered wallets'
                color='primary'
                onClick={() => onClickDeployment('RELAY')}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container justifyContent='center' alignItems='center' height='100%' padding='0.5rem'>
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
              title='Generate Keys'
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
              icon={ImportExport}
              title='Import / Export Vault'
              description='Addresses CSV'
              color='primary'
              href='/csv'
              disabled={!hasExtendedKeys}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
