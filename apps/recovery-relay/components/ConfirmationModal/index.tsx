import { ReactNode, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DialogProps,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  TextField,
  Button,
  NextLinkComposed,
  monospaceFontFamily,
  getLogger,
  useWrappedState,
} from '@fireblocks/recovery-shared';
import { decryptInput } from '@fireblocks/recovery-shared/schemas';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';

type FormData = z.infer<typeof decryptInput>;

type Props = Omit<DialogProps, 'open' | 'onClose' | 'onSubmit'> & {
  isOpen: boolean;
  isLoading: boolean;
  error?: Error | null;
  amount: number;
  assetSymbol: string;
  fromAddress: string;
  toAddress: string;
  txUrl?: string;
  onClose: () => void;
  onSubmit: () => void;
};

const logger = getLogger(LOGGER_NAME_UTILITY);

export const ConfirmationModal = ({
  isOpen,
  isLoading,
  error,
  amount,
  assetSymbol,
  fromAddress,
  toAddress,
  txUrl,
  onClose,
  onSubmit: _onSubmit,
  ...props
}: Props) => {
  const headingId = useId();
  const descriptionId = useId();

  const [decryptionError, setDecryptionError] = useWrappedState<string | undefined>('decryptionError', undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(decryptInput),
    defaultValues: {
      pin: '',
    },
  });

  const onSubmit = async () => {
    try {
      _onSubmit();
    } catch (err: unknown) {
      logger.error(`Failed to submit confirmation - ${(err as Error).message}`, err);
      setDecryptionError('Invalid PIN');

      onClose();
    }
  };

  const txDescription = (
    <DialogContentText id={descriptionId} textAlign='center'>
      {amount} {assetSymbol} from{' '}
      <Typography component='span' display='block' fontFamily={monospaceFontFamily} noWrap>
        {fromAddress}
      </Typography>{' '}
      to{' '}
      <Typography component='span' display='block' fontFamily={monospaceFontFamily} noWrap>
        {toAddress}
      </Typography>
    </DialogContentText>
  );

  let DialogChild: ReactNode;

  if (isLoading) {
    DialogChild = (
      <DialogContent
        sx={{
          padding: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size='48px' />
      </DialogContent>
    );
  } else if (error) {
    DialogChild = (
      <>
        <DialogTitle id={headingId} variant='h1'>
          Transaction Failed
        </DialogTitle>
        <DialogContent sx={{ padding: '1rem' }}>
          <DialogContentText>{txDescription}</DialogContentText>
          <Divider sx={{ margin: '1rem 0' }} />
          <DialogContentText
            fontFamily={monospaceFontFamily}
            color={(theme) => theme.palette.error.main}
            sx={{ whiteSpace: 'pre-wrap' }}
          >
            {error.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '1rem' }}>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </>
    );
  } else if (txUrl) {
    DialogChild = (
      <>
        <DialogTitle id={headingId} variant='h1'>
          Sent Transaction
        </DialogTitle>
        <DialogContent sx={{ padding: '1rem' }}>
          <DialogContentText>{txDescription}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '1rem' }}>
          <Button variant='outlined' onClick={onClose}>
            Close
          </Button>
          <Button component={NextLinkComposed} to={txUrl} target='_blank' rel='noopener noreferrer' sx={{ marginLeft: '8px' }}>
            View Transaction
          </Button>
        </DialogActions>
      </>
    );
  } else {
    DialogChild = (
      <Box component='form' onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle id={headingId} variant='h1'>
          Confirm Transaction
        </DialogTitle>
        <DialogContent sx={{ padding: '1rem' }}>
          <DialogContentText>{txDescription}</DialogContentText>
          <Box display='flex' alignItems='center' justifyContent='center' marginTop='2em'>
            <TextField
              id='pin'
              type='password'
              label='Private Key PIN'
              helpText={decryptInput.shape.pin.description}
              error={errors.pin?.message ?? decryptionError}
              inputProps={{ minLength: 6, maxLength: 6 }}
              autoFocus
              {...register('pin')}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '1rem' }}>
          <Button variant='outlined' onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit'>Send Transaction</Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Dialog
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      maxWidth='sm'
      sx={{ borderRadius: '16px' }}
      open={isOpen}
      onClose={onClose}
      {...props}
    >
      {DialogChild}
    </Dialog>
  );
};
