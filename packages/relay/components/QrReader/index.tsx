import { useRef, useId, useState, useEffect } from "react";
import "webrtc-adapter";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Result } from "@zxing/library";
import { Box } from "@mui/material";
import {
  QrCodeScanner as QrCodeScannerIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

type Props = {
  /**
   * Media track constraints object, to specify which camera and capabilities to use
   */
  constraints?: MediaTrackConstraints;
  /**
   * Called when QR code data is detected and validated.
   * @returns true if the QR code is valid, false otherwise
   */
  onValidate?: (
    /**
     * The QR values extracted by Zxing
     */
    result: Result,
    /**
     * The instance of the QR browser reader
     */
    codeReader?: BrowserQRCodeReader
  ) => boolean;
  /**
   * Called when QR code data is detected.
   */
  onResult?: (
    /**
     * The QR values extracted by Zxing
     */
    result: Result,
    /**
     * The instance of the QR browser reader
     */
    codeReader?: BrowserQRCodeReader
  ) => void;
  /**
   * Called when an error occurs.
   */
  onError?: (
    /**
     * The name of the exceptions thrown while reading the QR
     */
    error: Error,
    /**
     * The instance of the QR browser reader
     */
    codeReader?: BrowserQRCodeReader
  ) => void;
  /**
   * Property that represents the scan period
   */
  scanDelay?: number;
};

export const QrReader = ({
  constraints,
  scanDelay,
  onValidate,
  onResult,
  onError,
}: Props) => {
  const videoId = useId();

  const controlsRef = useRef<IScannerControls | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let successTimeout: NodeJS.Timeout;

    const codeReader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: scanDelay,
    });

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      const message = "MediaDevices API has no support for your browser.";

      onError?.(new Error(message), codeReader);
    }

    const startCodeReader = async () => {
      try {
        const controls = await codeReader.decodeFromConstraints(
          { video: constraints },
          videoId,
          (result) => {
            clearTimeout(successTimeout);

            if (result) {
              onResult?.(result, codeReader);

              const isValid = onValidate?.(result, codeReader) ?? true;
              setIsSuccess(isValid);
              successTimeout = setTimeout(() => setIsSuccess(false), 1000);
            }
          }
        );

        controlsRef.current = controls;
      } catch (error) {
        onError?.(error as Error, codeReader);
      }
    };

    startCodeReader();

    return () => {
      clearTimeout(successTimeout);

      controlsRef.current?.stop();
    };
  }, []);

  const Icon = isSuccess ? CheckCircleIcon : QrCodeScannerIcon;

  return (
    <Box
      width="100%"
      height="100%"
      overflow="hidden"
      position="relative"
      sx={{ aspectRatio: "1" }}
    >
      <Icon
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
