import React, { useState, ChangeEvent } from 'react';
import { Box, Chip, TextField, Typography } from '@mui/material';

interface DerivationPathInputProps {
  onChange?: (path: string) => void;
  disabled?: boolean;
  defaultValues?: {
    coinType?: string;
    account?: string;
    change?: string;
    addressIndex?: string;
  };
}

const DerivationPathInput: React.FC<DerivationPathInputProps> = ({ onChange, disabled, defaultValues = {} }) => {
  const [coinType, setCoinType] = useState(defaultValues.coinType || '');
  const [account, setAccount] = useState(defaultValues.account || '');
  const [change, setChange] = useState(defaultValues.change || '');
  const [addressIndex, setAddressIndex] = useState(defaultValues.addressIndex || '');

  const handleCoinTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCoinType(e.target.value);
    updatePath(e.target.value, account, change, addressIndex);
  };

  const handleAccountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAccount(e.target.value);
    updatePath(coinType, e.target.value, change, addressIndex);
  };

  const handleChangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChange(e.target.value);
    updatePath(coinType, account, e.target.value, addressIndex);
  };

  const handleAddressIndexChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAddressIndex(e.target.value);
    updatePath(coinType, account, change, e.target.value);
  };

  const updatePath = (coinType: string, account: string, change: string, addressIndex: string) => {
    if (onChange) {
      const path = `m/44'/${coinType}'/${account}'/${change}/${addressIndex}`;
      onChange(path);
    }
  };

  return (
    <Box sx={{ width: 'fit-content' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Chip label='m/' variant='filled' color='default' sx={{ mr: 0.5, fontFamily: 'monospace' }} />

        <Chip label="44'" variant='filled' color='default' sx={{ mr: 0.5, fontFamily: 'monospace' }} />

        <Typography variant='body2' sx={{ mx: 0.5 }}>
          /
        </Typography>

        <TextField
          placeholder='0'
          value={coinType}
          disabled={disabled}
          onChange={handleCoinTypeChange}
          size='small'
          sx={{
            width: '60px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontFamily: 'monospace',
            },
          }}
        />

        <Typography variant='body2' sx={{ mx: 0.5 }}>
          '
        </Typography>

        <Typography variant='body2' sx={{ mx: 0.5 }}>
          /
        </Typography>

        <TextField
          placeholder='0'
          disabled={disabled}
          value={account}
          onChange={handleAccountChange}
          size='small'
          sx={{
            width: '60px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontFamily: 'monospace',
            },
          }}
        />

        <Typography variant='body2' sx={{ mx: 0.5 }}>
          '
        </Typography>

        <Typography variant='body2' sx={{ mx: 0.5 }}>
          /
        </Typography>

        <TextField
          placeholder='0'
          disabled={disabled}
          value={change}
          onChange={handleChangeChange}
          size='small'
          sx={{
            width: '60px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontFamily: 'monospace',
            },
          }}
        />

        <Typography variant='body2' sx={{ mx: 0.5 }}>
          /
        </Typography>

        <TextField
          placeholder='0'
          disabled={disabled}
          value={addressIndex}
          onChange={handleAddressIndexChange}
          size='small'
          sx={{
            width: '60px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontFamily: 'monospace',
            },
          }}
        />
      </Box>

      <Typography variant='caption' sx={{ mt: 1, display: 'block' }}>
        Format: m / purpose' / coin_type' / account' / change / address_index
      </Typography>
    </Box>
  );
};

export default DerivationPathInput;
