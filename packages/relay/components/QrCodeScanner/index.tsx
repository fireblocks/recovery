import "webrtc-adapter";
import { useState, useRef, useId, useCallback, useEffect } from "react";
import QrScanner from "qr-scanner";
import {
  Box,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  NativeSelect,
  IconButton,
} from "@mui/material";
import {
  QrCodeScanner as QrCodeScannerIcon,
  FlashlightOn,
  FlashlightOff,
} from "@mui/icons-material";

export type ScanResult = QrScanner.ScanResult;

type Props = {
  onDecode: (result: QrScanner.ScanResult) => void;
};

export const QrCodeScanner = ({ onDecode }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [preferredCamera, setPreferredCamera] = useState<
    QrScanner.FacingMode | QrScanner.DeviceId | undefined
  >();
  const [flash, setFlash] = useState<boolean | undefined>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const cameraSelectId = useId();

  const FlashIcon = flash ? FlashlightOn : FlashlightOff;

  const iconProps = {
    color: "#FFF",
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: "2",
  };

  const handleCameraChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (qrScannerRef.current) {
      setIsLoading(true);

      const facingModeOrDeviceId = event.target.value;

      await qrScannerRef.current.setCamera(facingModeOrDeviceId);

      setPreferredCamera(facingModeOrDeviceId);

      setIsLoading(false);
    }
  };

  const handleFlashChange = async () => {
    if (qrScannerRef.current && typeof flash === "boolean") {
      await qrScannerRef.current.toggleFlash();

      setFlash(qrScannerRef.current.isFlashOn());
    }
  };

  const startScanner = useCallback(async () => {
    try {
      if (!videoRef.current || !(await QrScanner.hasCamera())) {
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

      const cameras = await QrScanner.listCameras(true);

      const flash = (await qrScannerRef.current.hasFlash())
        ? qrScannerRef.current.isFlashOn()
        : undefined;

      setCameras(cameras);
      setFlash(flash);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, [onDecode, preferredCamera]);

  const stopScanner = () => {};

  useEffect(() => {
    void startScanner();

    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      width="100%"
      height="100%"
      overflow="hidden"
      position="relative"
      sx={{ aspectRatio: "1" }}
    >
      {isLoading ? (
        <CircularProgress
          size="48px"
          sx={{
            ...iconProps,
            marginTop: "-24px",
            marginLeft: "-24px",
          }}
        />
      ) : (
        <QrCodeScannerIcon
          sx={{
            ...iconProps,
            width: "25%",
            height: "25%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      {!!(cameras.length || typeof flash === "boolean") && (
        <Box
          padding="1em"
          width="100%"
          position="absolute"
          bottom="0"
          left="0"
          zIndex="3"
          color="#FFF"
          sx={{ backgroundColor: (theme) => theme.palette.primary.main }}
        >
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Grid item>
              {!!cameras.length && (
                <FormControl
                  fullWidth
                  variant="standard"
                  sx={{ color: "#FFF" }}
                >
                  <InputLabel
                    variant="standard"
                    htmlFor={cameraSelectId}
                    sx={{ color: "#FFF !important" }}
                  >
                    Camera
                  </InputLabel>
                  <NativeSelect
                    variant="standard"
                    defaultValue={preferredCamera ?? cameras[0].id}
                    inputProps={{
                      name: "camera",
                      id: cameraSelectId,
                    }}
                    onChange={handleCameraChange}
                    sx={{ color: "#FFF", "&:before": { borderColor: "#FFF" } }}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
              )}
            </Grid>
            <Grid item>
              {typeof flash === "boolean" && (
                <IconButton
                  aria-label={`Turn flash ${flash ? "off" : "on"}`}
                  color="inherit"
                  onClick={handleFlashChange}
                >
                  <FlashIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
      <Box
        component="video"
        ref={videoRef}
        muted
        playsInline
        controls={false}
        width="100%"
        height="100%"
        position="absolute"
        top="0"
        left="0"
        style={{
          background: "#000",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
};
