import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Accounts = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/accounts/vault');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default Accounts;
