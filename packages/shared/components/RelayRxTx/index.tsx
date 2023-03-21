import React from 'react';
import { Box, Grid, lighten, Typography } from '@mui/material';
import { CallMade, CallReceived } from '@mui/icons-material';
import { theme } from '../../theme';
import { QrCode } from '../QrCode';
import { QrCodeScanner, ScanResult } from '../QrCodeScanner';

type Props = {
  rxTitle?: string;
  txTitle?: string;
  txUrl?: string;
  onDecodeQrCode?: (rxUrl: string) => void;
};

export const RelayRxTx = ({ rxTitle, txTitle, txUrl, onDecodeQrCode }: Props) => {
  const showStatus = !!txTitle || !!rxTitle;

  const onDecode = onDecodeQrCode ? ({ data }: ScanResult) => onDecodeQrCode(data) : undefined;

  return (
    <>
      {showStatus && (
        <Box
          sx={(t) => ({
            color: t.palette.primary.main,
            border: `solid 1px ${t.palette.primary.main}`,
            background: lighten(t.palette.primary.main, 0.95),
            width: '100%',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1em',
          })}
        >
          <Grid container>
            {!!txTitle && (
              <Grid item xs={6}>
                <Typography variant='caption' fontWeight={500} color='inherit' display='flex' alignItems='center'>
                  <CallMade fontSize='small' sx={{ marginRight: '0.25rem' }} /> Sending
                </Typography>
                <Typography variant='body1' color='inherit'>
                  {txTitle}
                </Typography>
              </Grid>
            )}
            {!!rxTitle && (
              <Grid item xs={6}>
                <Typography variant='caption' fontWeight={500} color='inherit' display='flex' alignItems='center'>
                  <CallReceived fontSize='small' sx={{ marginRight: '0.25rem' }} /> Receiving
                </Typography>
                <Typography variant='body1' color='inherit'>
                  {rxTitle}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
      <Grid container spacing={1} alignItems='flex-start' justifyContent='center'>
        {!!txUrl && (
          <Grid item xs={6}>
            <QrCode title='Relay URL' data={txUrl} bgColor={theme.palette.background.paper} />
          </Grid>
        )}
        {!!onDecode && (
          <Grid item xs={6}>
            <QrCodeScanner onDecode={onDecode} />
          </Grid>
        )}
      </Grid>
    </>
  );
};
