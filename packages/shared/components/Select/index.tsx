import React, { forwardRef, ReactNode, RefObject } from 'react';
import {
  FormControl,
  FormControlProps,
  FormHelperText,
  InputLabel,
  Select as MuiSelect,
  SelectProps as MuiSelectProps,
  MenuItem,
} from '@mui/material';
import { InputBase } from '../InputBase';

export type SelectProps<T = unknown> = Omit<MuiSelectProps<T>, 'error'> & {
  id: string;
  error?: ReactNode;
  helpText?: ReactNode;
  label?: ReactNode;
  hideLabel?: boolean;
  formControlProps?: FormControlProps;
  items: { value: string; children: ReactNode }[];
};

export const Select = forwardRef<HTMLInputElement, SelectProps<unknown>>(
  (
    {
      id,
      error,
      label,
      hideLabel,
      formControlProps,
      value,
      defaultValue,
      items,
      helpText: _helpText,
      inputRef: _inputRef,
      ...props
    },
    ref,
  ) => {
    const inputRef = (_inputRef || ref) as RefObject<HTMLInputElement> | undefined;

    const helpText = error || _helpText;

    return (
      <FormControl variant='standard' fullWidth {...formControlProps}>
        {!!label && !hideLabel && (
          <InputLabel
            shrink
            variant='standard'
            htmlFor={id}
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#000000',
              marginBottom: '0.5rem',
            }}
          >
            {label}
          </InputLabel>
        )}
        <MuiSelect
          id={id}
          aria-describedby={`${id}-helper-text`}
          color={error ? 'error' : 'primary'}
          label={label}
          value={value}
          defaultValue={defaultValue || value}
          error={!!error}
          inputRef={inputRef}
          input={<InputBase />}
          MenuProps={{
            ...props.MenuProps,
            MenuListProps: {
              ...props.MenuProps?.MenuListProps,
              sx: { ...props.MenuProps?.MenuListProps?.sx, backgroundColor: '#FCFCFC' },
            },
          }}
          {...props}
        >
          {items.map((item) => (
            <MenuItem key={item.value} value={item.value} sx={{ backgroundColor: '#FCFCFC' }}>
              {item.children}
            </MenuItem>
          ))}
        </MuiSelect>
        {!!helpText && (
          <FormHelperText id={`${id}-helper-text`} error={!!error}>
            {helpText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

Select.displayName = 'Select';
