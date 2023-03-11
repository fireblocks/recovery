import { useState, useEffect } from 'react';

export const useSecureContextCheck = () => {
  const [isSecureContext, setIsSecureContext] = useState(false);

  useEffect(() => setIsSecureContext(window.isSecureContext), []);

  return isSecureContext;
};
