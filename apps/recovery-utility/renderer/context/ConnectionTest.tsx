import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface IConnectionTestContext {
  isOnline: boolean;
}

const defaultValue: IConnectionTestContext = {
  isOnline: false,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const ConnectionTestProvider = ({ children }: Props) => {
  const [isOnline, setIsOnline] = useState(defaultValue.isOnline);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value: IConnectionTestContext = { isOnline };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useConnectionTest = () => useContext(Context);
