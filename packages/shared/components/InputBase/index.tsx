import { styled, alpha, InputBase as MuiInputBase } from '@mui/material';

export const InputBase = styled(MuiInputBase)(({ theme }) => ({
  fontSize: '16px',
  borderRadius: '10px',
  backgroundColor: '#FCFCFC',
  border: `solid 1px ${theme.palette.grey[400]}`,
  transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
  'label + &': {
    marginTop: theme.spacing(3),
  },
  '& .MuiInputBase-input': {
    padding: '10px 12px',
  },
  '&:has(.MuiInputBase-input:focus)': {
    boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
    borderColor: theme.palette.primary.main,
  },
  "&:has(.MuiInputBase-input[aria-invalid='true'])": {
    borderColor: theme.palette.error.main,
  },
  "&:has(.MuiInputBase-input[aria-invalid='true']:focus)": {
    boxShadow: `${alpha(theme.palette.error.main, 0.25)} 0 0 0 0.2rem`,
  },
  '&:has(.MuiInputAdornment-positionStart)': {
    paddingLeft: '12px',
    '& .MuiInputBase-input': {
      paddingLeft: '0',
    },
  },
  '&:has(.MuiInputAdornment-positionEnd)': {
    paddingRight: '12px',
    '& .MuiInputBase-input': {
      paddingRight: '0',
    },
  },
}));
