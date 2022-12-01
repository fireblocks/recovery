import { useDropzone } from "react-dropzone";
import { Box, FormHelperText, Typography } from "@mui/material";
import { FileUpload, CheckCircle, Cancel } from "@mui/icons-material";
import { theme } from "../../lib/theme";

type Props = {
  hasExistingFile?: boolean;
  error?: string;
  accept?: { [key: string]: string[] };
  onDrop: (file: File) => void;
};

export const UploadWell = ({
  hasExistingFile = false,
  error,
  accept,
  onDrop: _onDrop,
}: Props) => {
  const onDropAccepted = (files: File[]) => _onDrop(files[0]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      accept,
      multiple: false,
      onDropAccepted,
    });

  const isActive = hasExistingFile || isDragAccept;

  return (
    <Box marginBottom={error ? "0" : "23px"} {...getRootProps()}>
      <Box
        paddingX="3rem"
        paddingY="1.5rem"
        textAlign="center"
        color={isActive ? "#FFFFFF" : theme.palette.text.primary}
        border={`solid 1px ${
          isActive
            ? theme.palette.secondary.main
            : error || isDragReject
            ? theme.palette.error.main
            : theme.palette.text.primary
        }`}
        borderRadius="10px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          backgroundColor: isActive ? "#0081D6" : "#E0E0E0",
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        {isDragReject ? (
          <Cancel />
        ) : isActive ? (
          <CheckCircle />
        ) : (
          <FileUpload />
        )}
        <Typography fontSize="16px" sx={{ marginLeft: "0.5rem" }}>
          {isDragReject
            ? "Invalid file"
            : isActive
            ? "File selected"
            : "Drag & drop or select file"}
        </Typography>
      </Box>
      {!!error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
};
