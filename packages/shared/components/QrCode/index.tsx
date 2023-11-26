import React, { Box, BoxProps, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { TextField } from '../TextField';
import { useWrappedState } from '../../lib/debugUtils';
import { BaseModal } from '../BaseModal';

type Props = BoxProps & {
  data?: string;
  title?: string;
  bgColor?: string;
  fgColor?: string;
  showRawData?: boolean;
};

export const QrCode = ({ data, title, bgColor, fgColor, height, width, showRawData = true, ...props }: Props) => {
  const [showExpandedQRCode, setShowExapndedQRCode] = useWrappedState<boolean>('showExpandedQRCode', false);
  // const [cursor, setCursor] = useWrappedState<
  return (
    <Box
      height={height}
      width={width ?? '100%'}
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent={data ? 'flex-start' : 'center'}
      {...props}
    >
      {data ? (
        <>
          <QRCodeSVG
            value={data}
            size={512}
            bgColor={bgColor}
            fgColor={fgColor}
            includeMargin={false}
            style={{
              aspectRatio: '1',
              height: 'auto',
              width: '100%',
            }}
            cursor='pointer'
            onClick={() => {
              setShowExapndedQRCode(true);
            }}
          />
          {showRawData && (
            <TextField
              id='qrCodeData'
              label={title}
              value={data}
              fullWidth
              enableCopy
              isMonospace
              formControlProps={{ sx: { margin: '1em 0 0 0' } }}
            />
          )}
        </>
      ) : (
        <Box
          display='flex'
          alignItems='center'
          justifyContent='center'
          width='100%'
          height='auto'
          sx={{
            aspectRatio: '1',
            background: (theme) => theme.palette.grey[300],
          }}
        >
          <Typography variant='body1'>No QR code data</Typography>
        </Box>
      )}
      <BaseModal
        open={showExpandedQRCode}
        title={`${title} - Large QR`}
        onClose={() => {
          setShowExapndedQRCode(false);
        }}
      >
        <QRCodeSVG
          value={data!}
          size={1024}
          bgColor={bgColor}
          fgColor={fgColor}
          includeMargin={false}
          style={{
            aspectRatio: '1',
            height: 'auto',
            width: '100%',
          }}
          onClick={() => {
            setShowExapndedQRCode(true);
          }}
        />
      </BaseModal>
    </Box>
  );
};
