import { forwardRef, ReactNode } from "react";
import { alpha, styled } from "@mui/material/styles";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  InputBase,
  InputBaseProps,
} from "@mui/material";

const Input = styled(InputBase)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(3),
  },
  "& .MuiInputBase-input": {
    fontSize: "16px",
    borderRadius: "10px",
    backgroundColor: "#FCFCFC",
    border: "1px solid #C0C0C0",
    padding: "10px 12px",
    transition: theme.transitions.create([
      "border-color",
      "background-color",
      "box-shadow",
    ]),
    "&:focus": {
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      borderColor: theme.palette.primary.main,
    },
    "&[aria-invalid='true']": {
      borderColor: theme.palette.error.main,
    },
  },
}));

type Props = Omit<InputBaseProps, "error"> & {
  id: string;
  label?: ReactNode;
  error?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, Props>(
  ({ id, label, error, ...props }, ref) => (
    <FormControl variant="standard" fullWidth>
      {!!label && (
        <InputLabel
          shrink
          htmlFor={id}
          sx={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#000000",
            marginBottom: "0.5rem",
          }}
        >
          {label}
        </InputLabel>
      )}
      <Input
        id={id}
        aria-describedby={`${id}-helper-text`}
        color={error ? "error" : "primary"}
        error={!!error}
        inputRef={ref || props.inputRef}
        {...props}
      />
      {!!error && (
        <FormHelperText id={`${id}-helper-text`} error>
          {error}
        </FormHelperText>
      )}
    </FormControl>
  )
);

TextField.displayName = "TextField";
