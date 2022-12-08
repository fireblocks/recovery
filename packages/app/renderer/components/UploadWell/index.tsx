import { useDropzone } from "react-dropzone";
import { Box, FormHelperText, Typography } from "@mui/material";
import { FileUpload, CheckCircle, Cancel } from "@mui/icons-material";

type Props = {
  hasFile?: boolean;
  error?: string;
  accept?: { [key: string]: string[] };
  disabled?: boolean;
  onDrop: (file: File) => void;
};

export const UploadWell = ({
  hasFile,
  error,
  accept,
  disabled,
  onDrop: _onDrop,
}: Props) => {
  const onDropAccepted = (files: File[]) => _onDrop(files[0]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      accept,
      disabled,
      multiple: false,
      onDropAccepted,
    });

  const isActive = hasFile || isDragAccept;

  let InputIcon = FileUpload;
  let inputText = "Drag & drop or select file";

  if (isActive) {
    InputIcon = CheckCircle;
  }

  if (hasFile) {
    inputText = "File selected";
  }

  if (isDragAccept) {
    inputText = "Drop file";
  }

  if (isDragReject) {
    InputIcon = Cancel;
    inputText = "Invalid file";
  }

  return (
    <Box marginBottom={error ? "0" : "23px"} {...getRootProps()}>
      <Box
        paddingX="3rem"
        paddingY="1.5rem"
        textAlign="center"
        color={(theme) => (isActive ? "#FFFFFF" : theme.palette.text.primary)}
        border={(theme) =>
          `solid 1px ${
            isActive
              ? theme.palette.secondary.main
              : error || isDragReject
              ? theme.palette.error.main
              : theme.palette.text.primary
          }`
        }
        borderRadius="10px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          backgroundColor: (theme) =>
            isActive
              ? theme.palette.primary.main
              : disabled
              ? theme.palette.background.default
              : "#E0E0E0",
          background: isActive
            ? "linear-gradient(10.71deg, #1866CC 6.42%, #0075F2 93.52%)"
            : undefined,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <input {...getInputProps()} />
        <InputIcon sx={{ marginRight: "0.5rem" }} />
        <Typography fontSize="16px">{inputText}</Typography>
      </Box>
      {!!error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
};
