import React, { useId, ReactNode } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Box, FormHelperText, Typography } from '@mui/material';
import { FileUpload, CheckCircle, Cancel } from '@mui/icons-material';
import { useWrappedState } from '../../lib/debugUtils';

type Props = {
  label?: ReactNode;
  error?: ReactNode;
  hasFile?: boolean;
  accept?: Accept;
  disabled?: boolean;
  hidden?: boolean;
  id?: string;
  onDrop: (file: File) => void;
};

export const UploadWell = ({ id, label, error, hasFile, accept, disabled, hidden = false, onDrop: _onDrop }: Props) => {
  const labelId = useId();

  const [fileName, setFileName] = useWrappedState<string | undefined>('uploadWell-fileName', undefined);

  const extensions = Object.values(accept || {})
    .flat()
    .join(' / ')
    .toUpperCase();

  const onDropAccepted = (files: File[]) => {
    setFileName(files[0].name);
    _onDrop(files[0]);
  };

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    accept,
    disabled,
    multiple: false,
    onDropAccepted,
  });

  const isActive = hasFile || isDragAccept;

  let InputIcon = FileUpload;
  let inputText: ReactNode = 'Drop or select file';

  if (isActive) {
    InputIcon = CheckCircle;
  }

  if (hasFile) {
    inputText = (
      <span>
        File selected
        <br />({fileName})
      </span>
    );
  }

  if (isDragAccept) {
    inputText = 'Drop file';
  }

  if (isDragReject) {
    InputIcon = Cancel;
    inputText = 'Invalid file';
  }

  if (hidden) {
    return <span style={{ display: 'none' }} />;
  }

  return (
    <Box marginBottom={error ? '0' : '23px'} {...getRootProps()}>
      {(!!label || !!extensions) && (
        <Typography id={labelId} variant='h3' marginBottom='0'>
          {label}
          {!!extensions && (
            <Typography variant='caption' paragraph>
              {extensions}
            </Typography>
          )}
        </Typography>
      )}
      <Box
        aria-labelledby={label ? labelId : undefined}
        paddingX='2rem'
        paddingY='1.5rem'
        textAlign='center'
        color={(theme) => (isActive ? '#FFFFFF' : theme.palette.text.primary)}
        border={(theme) => {
          let borderColor = theme.palette.text.primary;

          if (isActive) {
            borderColor = theme.palette.secondary.main;
          } else if (error || isDragReject) {
            borderColor = theme.palette.error.main;
          }

          return `solid 1px ${borderColor}`;
        }}
        borderRadius='10px'
        display='flex'
        alignItems='center'
        justifyContent='center'
        sx={{
          backgroundColor: (theme) => {
            let backgroundColor = '#E0E0E0';

            if (isActive) {
              backgroundColor = theme.palette.primary.main;
            } else if (disabled) {
              backgroundColor = theme.palette.background.default;
            }

            return backgroundColor;
          },
          background: isActive ? 'linear-gradient(10.71deg, #1866CC 6.42%, #0075F2 93.52%)' : undefined,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <input id={id} {...getInputProps()} />
        <InputIcon sx={{ marginRight: '0.5rem' }} />
        <Typography fontSize='16px'>{inputText}</Typography>
      </Box>
      {!!error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
};
