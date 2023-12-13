import React, { forwardRef, ReactNode, FocusEvent, RefObject, useRef } from 'react';
import copy from 'copy-to-clipboard';
import {
  FormControl,
  FormControlProps,
  FormHelperText,
  InputLabel,
  InputBaseProps,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material';
import { Button, BaseModal } from '@fireblocks/recovery-shared';
import { Visibility, VisibilityOff, QrCode2, ContentCopy, Check } from '@mui/icons-material';
import { monospaceFontFamily } from '../../theme';
import { NextLinkComposed } from '../Link';
import { InputBase } from '../InputBase';
import { useWrappedState } from '../../lib/debugUtils';

export type TextFieldProps = Omit<InputBaseProps, 'error'> & {
  id: string;
  error?: ReactNode;
  helpText?: ReactNode;
  label?: ReactNode;
  hideLabel?: boolean;
  enableQr?: boolean;
  enableCopy?: boolean;
  isMonospace?: boolean;
  confirmRevealRequired?: boolean;
  confirmMessage?: string;
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
      confirmRevealRequired,
      confirmMessage,
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

    const [confirmOpen, setConfirmOpen] = useWrappedState<boolean>('textField-openConfirm', false);
    const [revealed, setRevealed] = useWrappedState<boolean>('textField-revealed', type !== 'password');
    const [copied, setCopied] = useWrappedState<boolean>('textField-copied', false);
    const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getData = () => {
      // if (typeof inputRef === 'function') {
      //   return '';
      // }

      return (value as string) || inputRef?.current?.value || (defaultValue as string) || '';
    };

    const handleToggleReveal = () => {
      if (confirmRevealRequired && !revealed) {
        setConfirmOpen(true);
      } else {
        setRevealed((prev) => !prev);
      }
    };

    const handleConfirm = () => {
      setRevealed(true);
      setConfirmOpen(false);
    };

    const handleCancel = () => setConfirmOpen(false);

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
                  <IconButton aria-label='Reveal' onClick={handleToggleReveal} edge='end'>
                    {revealed ? <VisibilityOff /> : <Visibility />}
                  </IconButton>

                  <BaseModal
                    open={confirmOpen}
                    onClose={handleCancel}
                    title='Confirm Reveal'
                    actions={
                      <>
                        <Button onClick={handleConfirm}>Confirm</Button>
                      </>
                    }
                  >
                    <Typography variant='body1' color={(theme) => theme.palette.error.main}>
                      {confirmMessage}
                    </Typography>
                  </BaseModal>
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
