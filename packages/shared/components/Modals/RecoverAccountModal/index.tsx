/* eslint-disable no-nested-ternary */
import React from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  InputAdornment,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { RecoverAccountInput, recoverAccountInputByAccounts } from '../../../schemas';
import { BaseModal } from '../../BaseModal';
import { Button } from '../../Button';
import { TextField } from '../../TextField';

type Props = {
  open: boolean;
  accountsKeys: number[];
  currentKeysetIndex?: [number, number];
  totalKeysetCount?: [number, number];
  hasMultipleKeysets: boolean;
  onClose: VoidFunction;
  addAccount: (name: string, id?: number, mapToNextKeyset?: boolean, ecdsa?: boolean) => number;
};

const defaultValues: RecoverAccountInput = { name: '', id: null, incrementEcdsaKeyset: null, incrementEddsaKeyset: null };

export const RecoverAccountModal = ({
  open,
  hasMultipleKeysets,
  currentKeysetIndex,
  totalKeysetCount,
  onClose: _onClose,
  accountsKeys,
  addAccount,
}: Props) => {
  const router = useRouter();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverAccountInput>({
    resolver: zodResolver(recoverAccountInputByAccounts(accountsKeys)),
    defaultValues,
  });

  const onClose = () => {
    _onClose();

    reset(defaultValues);
  };

  const onSubmit = (formData: RecoverAccountInput) => {
    const mapToNextKeyset =
      hasMultipleKeysets &&
      ((formData.incrementEcdsaKeyset == null ? false : formData.incrementEcdsaKeyset) ||
        (formData.incrementEddsaKeyset === null ? false : formData.incrementEddsaKeyset));
    const accountId = addAccount(
      formData.name,
      formData.id !== null && formData.id < 0 ? undefined : formData.id !== null ? formData.id : undefined,
      mapToNextKeyset,
      formData.incrementEcdsaKeyset === null,
    );

    router.push({
      pathname: '/accounts/vault/[accountId]',
      query: { accountId },
    });
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title='Recover Vault Account'
      actions={
        <>
          <Button variant='text' onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit'>Recover</Button>
        </>
      }
      // eslint-disable-next-line react/no-unstable-nested-components
      WrapperComponent={(props) => <form onSubmit={handleSubmit(onSubmit)} {...props} />}
    >
      <TextField
        id='accountName'
        label='Account Name'
        placeholder='e.g. Funding'
        error={errors.name?.message}
        autoFocus
        {...register('name')}
      />
      <Typography>&nbsp;</Typography>
      <Accordion>
        <AccordionSummary expandIcon={<ArrowDownwardIcon />}>
          <Typography component='span'>Advanced</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            id='accountId'
            label='Account Id (Optional)'
            placeholder='e.g. 1,2,...'
            error={errors.id?.message}
            autoFocus
            inputProps={{ type: 'number' }}
            inputMode='numeric'
            {...register('id')}
            endAdornment={
              <InputAdornment position='end'>
                <Tooltip
                  title='Vault Account ID is a unique positive integer that defines each vault.
          If you don’t provide this value, the utility will automatically use a new number by adding to the latest number used.'
                >
                  <HelpOutlineIcon />
                </Tooltip>
              </InputAdornment>
            }
          />
          {hasMultipleKeysets && currentKeysetIndex && totalKeysetCount && (
            <Grid container spacing={2} paddingTop={1}>
              <Grid item xs={12}>
                <Divider>
                  <Typography textAlign='center' variant='h2'>
                    Multiple Keysets with no Threshold Mapping
                  </Typography>
                </Divider>
              </Grid>
              {currentKeysetIndex[0] < totalKeysetCount[0] && (
                <Grid item xs={12}>
                  <FormControl>
                    <FormLabel>
                      <Typography variant='h3'>ECDSA</Typography> Total of {totalKeysetCount[0]} keysets, using keyset{' '}
                      {currentKeysetIndex[0]}{' '}
                    </FormLabel>
                    <RadioGroup defaultValue='no' {...register('incrementEcdsaKeyset')}>
                      <FormControlLabel value='no' control={<Radio />} label={`Continue using keyset ${currentKeysetIndex[0]}`} />
                      <FormControlLabel
                        value='yes'
                        control={<Radio />}
                        label={`Switch to keyset ${currentKeysetIndex[0] + 1} for this vault account and moving forward`}
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              )}
              {currentKeysetIndex[1] < totalKeysetCount[1] && (
                <Grid item xs={12}>
                  <FormControl>
                    <FormLabel>
                      <Typography variant='h3'>EDDSA</Typography> Total of {totalKeysetCount[1]} keysets, using keyset{' '}
                      {currentKeysetIndex[1]}{' '}
                    </FormLabel>
                    <RadioGroup defaultValue='no' {...register('incrementEddsaKeyset')}>
                      <FormControlLabel value='no' control={<Radio />} label={`Continue using keyset ${currentKeysetIndex[1]}`} />
                      <FormControlLabel
                        value='yes'
                        control={<Radio />}
                        label={`Switch to keyset ${currentKeysetIndex[1] + 1} for this vault account and moving forward`}
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>
    </BaseModal>
  );
};
