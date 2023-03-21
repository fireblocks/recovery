import React from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recoverAccountInput, RecoverAccountInput } from '../../../schemas';
import { BaseModal } from '../../BaseModal';
import { Button } from '../../Button';
import { TextField } from '../../TextField';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  addAccount: (name: string, id?: number) => number;
};

const defaultValues: RecoverAccountInput = { name: '' };

export const RecoverAccountModal = ({ open, onClose: _onClose, addAccount }: Props) => {
  const router = useRouter();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverAccountInput>({
    resolver: zodResolver(recoverAccountInput),
    defaultValues,
  });

  const onClose = () => {
    _onClose();

    reset(defaultValues);
  };

  const onSubmit = (formData: RecoverAccountInput) => {
    const accountId = addAccount(formData.name);

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
    </BaseModal>
  );
};
