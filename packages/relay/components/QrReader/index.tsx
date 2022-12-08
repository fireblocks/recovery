import { useRef, useEffect, useId } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Result } from "@zxing/library";
import { Box } from "@mui/material";
import { QrCodeScanner as QrCodeScannerIcon } from "@mui/icons-material";
import "webrtc-adapter";

export const isMediaDevicesSupported = () => {
  const isMediaDevicesSupported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices;

  if (!isMediaDevicesSupported) {
    console.warn(
      `[ReactQrReader]: MediaDevices API has no support for your browser. You can fix this by running "npm i webrtc-adapter"`
    );
  }

  return isMediaDevicesSupported;
};

export const isValidType = (value: any, name: string, type: string) => {
  const isValid = typeof value === type;

  if (!isValid) {
    console.warn(
      `[ReactQrReader]: Expected "${name}" to be a of type "${type}".`
    );
  }

  return isValid;
};

type OnResultFunction = (
  /**
   * The QR values extracted by Zxing
   */
  result?: Result | undefined | null,
  /**
   * The name of the exceptions thrown while reading the QR
   */
  error?: Error | undefined | null,
  /**
   * The instance of the QR browser reader
   */
  codeReader?: BrowserQRCodeReader
) => void;

type Props = {
  /**
   * Media track constraints object, to specify which camera and capabilities to use
   */
  constraints?: MediaTrackConstraints;
  /**
   * Called when an error occurs.
   */
  onResult?: OnResultFunction;
  /**
   * Property that represents the scan period
   */
  scanDelay?: number;
};

export const QrReader = ({ constraints, scanDelay, onResult }: Props) => {
  const videoId = useId();

  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: scanDelay,
    });

    if (
      !isMediaDevicesSupported() &&
      isValidType(onResult, "onResult", "function")
    ) {
      const message =
        'MediaDevices API has no support for your browser. You can fix this by running "npm i webrtc-adapter"';

      onResult?.(null, new Error(message), codeReader);
    }

    if (isValidType(constraints, "constraints", "object")) {
      codeReader
        .decodeFromConstraints(
          { video: constraints },
          videoId,
          (result, error) => {
            if (isValidType(onResult, "onResult", "function")) {
              onResult?.(result, error, codeReader);
            }
          }
        )
        .then((controls: IScannerControls) => (controlsRef.current = controls))
        .catch((error: Error) => {
          if (isValidType(onResult, "onResult", "function")) {
            onResult?.(null, error, codeReader);
          }
        });
    }

    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <Box
      width="100%"
      height="100%"
      overflow="hidden"
      position="relative"
      sx={{ aspectRatio: "1" }}
    >
      <QrCodeScannerIcon
        sx={{
          width: "25%",
          height: "25%",
          color: "#FFF",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
        }}
      />
      <Box
        component="video"
        id={videoId}
        muted
        top="0"
        left="0"
        width="100%"
        height="100%"
        display="block"
        overflow="hidden"
        position="absolute"
        style={{
          background: "#000",
          transform:
            constraints?.facingMode === "user" ? "scaleX(-1)" : undefined,
        }}
      />
    </Box>
  );
};

QrReader.displayName = "QrReader";
QrReader.defaultProps = {
  constraints: {
    facingMode: "user",
  },
  videoId: "video",
  scanDelay: 500,
};
