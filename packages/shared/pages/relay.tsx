import React from 'react';
import { Box, Typography } from '@mui/material';
import { RelayRxTx } from '../components/RelayRxTx';

type Props = {
  children?: React.ReactNode;
  rxTitle?: string;
  txTitle?: string;
  txUrl?: string;
  onDecodeQrCode: (rxUrl: string) => void;
};

export const RelayBasePage = ({ children, rxTitle, txTitle, txUrl, onDecodeQrCode }: Props) => (
  <Box>
    <Typography variant='h1'>Relay</Typography>
    {children}
    <RelayRxTx rxTitle={rxTitle} txTitle={txTitle} txUrl={txUrl} onDecodeQrCode={onDecodeQrCode} />
  </Box>
);
