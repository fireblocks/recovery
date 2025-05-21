import React, { useState, ChangeEvent } from 'react';
import { Box, Chip, TextField, Typography } from '@mui/material';
import { HDPath } from '@fireblocks/wallet-derivation';

interface DerivationPathInputProps {
  onChange?: (path: HDPath) => void;
  disabled?: boolean;
  defaultValues?: Partial<HDPath>;
}

const DerivationPathInput: React.FC<DerivationPathInputProps> = (props) => {
  const { onChange, disabled, defaultValues = {} } = props;
  const [coinType, setCoinType] = useState(defaultValues.coinType || 0);
  const [account, setAccount] = useState(defaultValues.account || 0);
  const [change, setChange] = useState(defaultValues.changeIndex || 0);
  const [addressIndex, setAddressIndex] = useState(defaultValues.addressIndex || 0);

  const handleCoinTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedCoinType = Number(e.target.value);
    setCoinType(updatedCoinType);
    updatePath(updatedCoinType, account, change, addressIndex);
  };

  const handleAccountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedAccount = Number(e.target.value);
    setAccount(updatedAccount);
    updatePath(coinType, updatedAccount, change, addressIndex);
  };

  const handleChangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedChange = Number(e.target.value);
    setChange(updatedChange);
    updatePath(coinType, account, updatedChange, addressIndex);
  };

  const handleAddressIndexChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedAddressIndex = Number(e.target.value);
    setAddressIndex(updatedAddressIndex);
    updatePath(coinType, account, change, updatedAddressIndex);
  };

  const updatePath = (coinType: number, account: number, changeIndex: number, addressIndex: number) => {
    if (onChange) {
      const path = { coinType, account, changeIndex, addressIndex };
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
