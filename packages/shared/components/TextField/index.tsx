import React, { forwardRef, useState, ReactNode, FocusEvent, RefObject, useRef } from 'react';
import copy from 'copy-to-clipboard';
import {
  FormControl,
  FormControlProps,
  FormHelperText,
  InputLabel,
  InputBaseProps,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, QrCode2, ContentCopy, Check } from '@mui/icons-material';
import { monospaceFontFamily } from '../../theme';
import { NextLinkComposed } from '../Link';
import { InputBase } from '../InputBase';

export type TextFieldProps = Omit<InputBaseProps, 'error'> & {
  id: string;
  error?: ReactNode;
  helpText?: ReactNode;
  label?: ReactNode;
  hideLabel?: boolean;
  enableQr?: boolean;
  enableCopy?: boolean;
  isMonospace?: boolean;
  formControlProps?: FormControlProps;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id,
      error,
      label,
      hideLabel,
      enableQr,
      enableCopy,
      isMonospace,
      formControlProps,
      type,
      value,
      defaultValue,
      readOnly,
      endAdornment,
      inputProps,
      helpText: _helpText,
      inputRef: _inputRef,
      onFocus: _onFocus,
      ...props
    },
    ref,
  ) => {
    const inputRef = (_inputRef || ref) as RefObject<HTMLInputElement> | undefined;

    const helpText = error || _helpText;

    const [revealed, setRevealed] = useState(type !== 'password');
    const [copied, setCopied] = useState(false);
    const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getData = () => {
      if (typeof inputRef === 'function') {
        return '';
      }

      return (value as string) || inputRef?.current?.value || (defaultValue as string) || '';
    };

    const onToggleReveal = () => setRevealed((prev) => !prev);

    const onCopy = () => {
      if (typeof copiedTimeoutRef.current === 'number') {
        clearTimeout(copiedTimeoutRef.current);
      }

      const data = getData();

      copy(data, { format: 'text/plain' });

      setCopied(true);

      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
    };

    const onFocus = (event: FocusEvent<HTMLInputElement>) => {
      if (enableCopy && type !== 'password') {
        event.target.select();
      }

      _onFocus?.(event);
    };

    return (
      <FormControl variant='standard' fullWidth {...formControlProps}>
        {!!label && !hideLabel && (
          <InputLabel
            shrink
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
        <InputBase
          id={id}
          aria-describedby={`${id}-helper-text`}
          color={error ? 'error' : 'primary'}
          type={revealed ? 'text' : type}
          value={value}
          defaultValue={defaultValue || value}
          error={!!error}
          readOnly={readOnly || enableCopy}
          inputRef={inputRef}
          inputProps={{
            ...inputProps,
            sx: isMonospace ? { ...inputProps?.sx, fontFamily: monospaceFontFamily } : inputProps?.sx,
          }}
          onFocus={onFocus}
          endAdornment={
            <>
              {endAdornment}
              {type === 'password' && (
                <InputAdornment position='end'>
                  <IconButton aria-label='Reveal' onClick={onToggleReveal} edge='end'>
                    {revealed ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )}
              {enableQr && (
                <InputAdornment position='end'>
                  <IconButton
                    aria-label='Show QR code'
                    edge='end'
                    component={NextLinkComposed}
                    to={{
                      pathname: '/qr',
                      query: {
                        data: getData(),
                        title: typeof label === 'string' ? label : undefined,
                      },
                    }}
                    target='_blank'
                  >
                    <QrCode2 />
                  </IconButton>
                </InputAdornment>
              )}
              {enableCopy && (
                <InputAdornment position='end'>
                  <IconButton aria-label='Copy' onClick={onCopy} edge='end'>
                    {copied ? <Check /> : <ContentCopy />}
                  </IconButton>
                </InputAdornment>
              )}
            </>
          }
          {...props}
        />
        {!!helpText && (
          <FormHelperText id={`${id}-helper-text`} error={!!error}>
            {helpText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

TextField.displayName = 'TextField';
