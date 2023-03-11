import { ReactNode } from 'react';
import { darken, Box } from '@mui/material';
import { CloudOutlined } from '@mui/icons-material';
import { Sidebar } from './components/Sidebar';
import { useConnectionTest } from '../../context/ConnectionTest';

type Props = {
  children: ReactNode;
};

export const Layout = ({ children }: Props) => {
  const { isOnline } = useConnectionTest();

  return (
    <Box
      height='100%'
      display='grid'
      gridTemplateColumns='180px 1fr'
      gridTemplateRows={`${isOnline ? 'min-content ' : ''} 1fr`}
      gridTemplateAreas={`${isOnline ? '"notice notice" ' : ''} "sidebar main"`}
    >
      {isOnline && (
        <Box
          component='aside'
          gridArea='notice'
          padding='0.5em 1em'
          display='flex'
          alignItems='center'
          justifyContent='center'
          textAlign='center'
          fontWeight='600'
          color='#FFF'
          zIndex='2'
          sx={(theme) => ({
            backgroundImage: `repeating-linear-gradient(45deg, ${darken(theme.palette.error.main, 0.1)}, ${darken(
              theme.palette.error.main,
              0.1,
            )} 1rem, ${theme.palette.error.main} 1rem, ${theme.palette.error.main} 2rem)`,
            backgroundSize: '200% 100%',
            animation: 'barberpole 30s linear infinite',
            '@keyframes barberpole': {
              from: {
                backgroundPosition: 'right',
              },
              to: {
                backgroundPosition: 'left',
              },
            },
          })}
        >
          <CloudOutlined sx={{ marginRight: '0.5rem' }} />
          This machine is connected to a network. Please disconnect.
        </Box>
      )}
      <Sidebar />
      <Box component='main' gridArea='main' padding='1em' overflow='auto'>
        {children}
      </Box>
    </Box>
  );
};
