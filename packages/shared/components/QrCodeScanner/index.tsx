import 'webrtc-adapter';
import React, { useState, useRef, useId, useCallback, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Box, Grid, CircularProgress, SelectChangeEvent, IconButton } from '@mui/material';
import { QrCodeScanner as QrCodeScannerIcon, FlashlightOn, FlashlightOff } from '@mui/icons-material';
import { Select } from '../Select';
import { LOGGER_NAME_SHARED } from '../../constants';
import { getLogger } from '../../lib/getLogger';

export type ScanResult = QrScanner.ScanResult;

type Props = {
  onDecode: (result: QrScanner.ScanResult) => void;
};

export const QrCodeScanner = ({ onDecode }: Props) => {
  const logger = getLogger(LOGGER_NAME_SHARED);
  const [isLoading, setIsLoading] = useState(true);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [preferredCamera, setPreferredCamera] = useState<QrScanner.FacingMode | QrScanner.DeviceId | undefined>();
  const [flash, setFlash] = useState<boolean | undefined>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const cameraSelectId = useId();

  const FlashIcon = flash ? FlashlightOn : FlashlightOff;

  const iconProps = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: '2',
  };

  const handleCameraChange = async (event: SelectChangeEvent<unknown>) => {
    if (qrScannerRef.current) {
      setIsLoading(true);

      logger.debug(`Changing camera to ${event.target.value}`);

      const facingModeOrDeviceId = event.target.value as string;

      await qrScannerRef.current.setCamera(facingModeOrDeviceId);

      setPreferredCamera(facingModeOrDeviceId);

      logger.debug(`Changed camera to ${event.target.value}`);

      setIsLoading(false);
    }
  };

  const handleFlashChange = async () => {
    if (qrScannerRef.current && typeof flash === 'boolean') {
      await qrScannerRef.current.toggleFlash();

      setFlash(qrScannerRef.current.isFlashOn());
    }
  };

  const startScanner = useCallback(async () => {
    try {
      if (!videoRef.current || !(await QrScanner.hasCamera())) {
        logger.error('No cameras detected');
        return;
      }

      setIsLoading(true);

      qrScannerRef.current = new QrScanner(videoRef.current, onDecode, {
        onDecodeError: () => undefined,
        preferredCamera,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      });

      await qrScannerRef.current.start();

      const newCameras = await QrScanner.listCameras(true);

      const newFlash = (await qrScannerRef.current.hasFlash()) ? qrScannerRef.current.isFlashOn() : undefined;

      setCameras(newCameras);
      setFlash(newFlash);
      setIsLoading(false);
    } catch (error) {
      console.error(`Failed to start scanner. ${(error as Error).message}`);
    }
  }, [onDecode, preferredCamera]);

  useEffect(() => {
    const stopScanner = () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };

    logger.log('Starting scanner');

    stopScanner();
    startScanner();

    logger.log('Done init scanner');

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box width='100%' display='flex' flexDirection='column'>
      <Box overflow='hidden' position='relative' sx={{ aspectRatio: '1' }}>
        {isLoading ? (
          <CircularProgress
            size='48px'
            color='primary'
            sx={(theme) => ({
              ...iconProps,
              color: theme.palette.primary.main,
              marginTop: '-24px',
              marginLeft: '-24px',
            })}
          />
        ) : (
          <QrCodeScannerIcon
            sx={{
              ...iconProps,
              color: '#FFF',
              width: '25%',
              height: '25%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
        <Box
          component='video'
          ref={videoRef}
          muted
          playsInline
          controls={false}
          width='100%'
          height='100%'
          position='absolute'
          top='0'
          left='0'
          sx={{
            background: (theme) => theme.palette.grey[300],
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      </Box>
      {!!(cameras.length || typeof flash === 'boolean') && (
        <Box marginTop='1em'>
          <Grid container spacing={1} flexWrap='nowrap' alignItems='flex-end' justifyContent='space-between'>
            {!!cameras.length && (
              <Grid item flex={1} sx={{ overflowX: 'hidden' }}>
                <Select
                  id={cameraSelectId}
                  label='Camera'
                  value={(preferredCamera ?? cameras[0].id) as unknown}
                  onChange={handleCameraChange}
                  items={cameras.map((camera) => ({ value: camera.id, children: camera.label }))}
                />
              </Grid>
            )}
            {typeof flash === 'boolean' && (
              <Grid item>
                <IconButton aria-label={`Turn flash ${flash ? 'off' : 'on'}`} color='inherit' onClick={handleFlashChange}>
                  <FlashIcon />
                </IconButton>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
