import { createTheme } from '@mui/material/styles';
import { TypographyStyleOptions } from '@mui/material/styles/createTypography';
import { heebo } from './fonts/heebo';

const headingProps = (fontSize = 14, marginY: number | string = '0.5rem'): TypographyStyleOptions => ({
  fontSize,
  fontWeight: 600,
  color: '#000000',
  margin: `${marginY} 0 ${marginY} 0`,
});

const h3Props = headingProps();

// TODO: Find a way to integrate this into a custom variant
export const monospaceFontFamily = [
  '"SF Mono"',
  'Monaco',
  'Inconsolata',
  '"Fira Mono"',
  '"Droid Sans Mono"',
  '"Source Code Pro"',
  'monospace',
].join(', ');

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0075F2',
    },
    secondary: {
      main: '#020C37',
    },
    error: {
      main: '#B7314E',
    },
    warning: {
      main: '#F59B00',
    },
    background: {
      default: '#F6F6F6',
      paper: '#F6F6F6',
    },
    text: {
      primary: '#747382',
      secondary: '#747382',
      disabled: '#747382',
    },
  },
  typography: {
    fontFamily: heebo.style.fontFamily,
    fontSize: 14,
    body1: {
      fontSize: 14,
    },
    body2: {
      fontSize: 14,
    },
    h1: headingProps(22, '1rem'),
    h2: headingProps(16),
    h3: h3Props,
    h4: h3Props,
    h5: h3Props,
    h6: h3Props,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
          cursor: 'default',
          userSelect: 'none',
        },
        body: {
          height: '100%',
        },
        '#__next': {
          height: '100%',
        },
        a: {
          WebkitUserDrag: 'none',
        },
        img: {
          WebkitUserDrag: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '16px',
          borderRadius: '10px',
          textTransform: 'none',
        },
        contained: {
          backgroundColor: '#FFF',
          boxShadow: '0px 9px 25px 1px rgb(1 22 45 / 8%);',
        },
        containedPrimary: {
          backgroundColor: '#4287F5',
          background: 'linear-gradient(10.71deg, #1866CC 6.42%, #0075F2 93.52%)',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
  },
});
