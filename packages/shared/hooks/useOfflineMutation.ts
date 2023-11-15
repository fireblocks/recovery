import { UseMutationOptions, useMutation } from '@tanstack/react-query';

export const useOfflineMutation = <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) => useMutation({ ...options, networkMode: 'always' });
