import { Box, Grid } from '@mui/material';
import { LeakAdd, Settings } from '@mui/icons-material';
import { LogoHero, Button, NextLinkComposed } from '@fireblocks/recovery-shared';

const Index = () => (
  <Box height='100%' padding='1rem' display='flex' alignItems='center' justifyContent='center'>
    <Grid container spacing={2} alignItems='center' maxWidth='800px'>
      <Grid item sm={6}>
        <LogoHero
          title='Recovery Relay'
          description='Make transactions from wallets recovered with Fireblocks Recovery Utility.'
          icon={LeakAdd}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button size='large' color='primary' fullWidth component={NextLinkComposed} to='/relay'>
              Scan QR Code
            </Button>
            <span style={{ paddingBottom: '2em' }}>&nbsp;</span>
            <Button size='large' color='primary' fullWidth component={NextLinkComposed} to='/settings'>
              <Settings /> Settings
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Box>
);

export default Index;
