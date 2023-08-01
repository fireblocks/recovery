import React from 'react';
import { Box, Typography } from '@mui/material';
import { BaseModal } from '../../BaseModal';

type Props = {
  open: boolean;
  error: string;
  title: string;
  onClose: VoidFunction;
};

export const ErrorModal = ({ open, title, error, onClose: _onClose }: Props) => {
  const onClose = () => {
    _onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} title={`❗️${title}`}>
      <Box
        height='100%'
        display='flex'
        flexDirection='column'
        borderRadius='6px'
        sx={{ background: '#FFF' }}
        padding='8px 8px 0 8px'
      >
        <Typography variant='body1' fontWeight='600' color={(theme) => theme.palette.error.main}>
          {error}
        </Typography>
      </Box>
    </BaseModal>
  );
};
