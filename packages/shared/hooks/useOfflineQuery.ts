import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';

export const useOfflineQuery = <
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'initialData'> & { initialData?: () => undefined },
) => useQuery({ ...options, cacheTime: 0, networkMode: 'always' });
