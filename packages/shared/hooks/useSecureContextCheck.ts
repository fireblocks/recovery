import { useEffect } from 'react';
import { useWrappedState } from '../lib/debugUtils';

export const useSecureContextCheck = () => {
  const [isSecureContext, setIsSecureContext] = useWrappedState('isSecureContext', false);

  useEffect(() => setIsSecureContext(window.isSecureContext), []);

  return isSecureContext;
};
