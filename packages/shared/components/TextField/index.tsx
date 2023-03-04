import React, {
  forwardRef,
  useState,
  ReactNode,
  FocusEvent,
  RefObject,
  useRef,
} from "react";
import copy from "copy-to-clipboard";
import { alpha, styled } from "@mui/material/styles";
import {
  FormControl,
  FormControlProps,
  FormHelperText,
  InputLabel,
  InputBase,
  InputBaseProps,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  QrCode2,
  ContentCopy,
  Check,
} from "@mui/icons-material";
import { NextLinkComposed } from "../Link";
import { monospaceFontFamily } from "@fireblocks/recovery-shared";

const Input = styled(InputBase)(({ theme }) => ({
  fontSize: "16px",
  borderRadius: "10px",
  backgroundColor: "#FCFCFC",
  border: `solid 1px ${theme.palette.grey[400]}`,
  transition: theme.transitions.create([
    "border-color",
    "background-color",
    "box-shadow",
  ]),
  "label + &": {
    marginTop: theme.spacing(3),
  },
  "& .MuiInputBase-input": {
    padding: "10px 12px",
  },
  "&:has(.MuiInputBase-input:focus)": {
    boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
    borderColor: theme.palette.primary.main,
  },
  "&:has(.MuiInputBase-input[aria-invalid='true'])": {
    borderColor: theme.palette.error.main,
  },
  "&:has(.MuiInputBase-input[aria-invalid='true']:focus)": {
    boxShadow: `${alpha(theme.palette.error.main, 0.25)} 0 0 0 0.2rem`,
  },
  "&:has(.MuiInputAdornment-positionStart)": {
    paddingLeft: "12px",
    "& .MuiInputBase-input": {
      paddingLeft: "0",
    },
  },
  "&:has(.MuiInputAdornment-positionEnd)": {
    paddingRight: "12px",
    "& .MuiInputBase-input": {
      paddingRight: "0",
    },
  },
}));

export type TextFieldProps = Omit<InputBaseProps, "error"> & {
  id: string;
  error?: ReactNode;
  helpText?: ReactNode;
  label?: ReactNode;
  hideLabel?: boolean;
  enableQr?: boolean;
  enableCopy?: boolean;
  isMonospace?: boolean;
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
      readOnly,
      endAdornment,
      inputProps,
      helpText: _helpText,
      inputRef: _inputRef,
      onFocus: _onFocus,
      ...props
    },
    ref
  ) => {
    const inputRef = (_inputRef || ref) as
      | RefObject<HTMLInputElement>
      | undefined;

    const helpText = error || _helpText;

    const [revealed, setRevealed] = useState(type !== "password");
    const [copied, setCopied] = useState(false);
    const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getData = () => {
      if (
        !value &&
        (typeof inputRef === "function" || !inputRef?.current?.value)
      ) {
        return "";
      }

      return (value as string) || inputRef?.current?.value || "";
    };

    const onToggleReveal = () => setRevealed((prev) => !prev);

    const onCopy = () => {
      if (typeof copiedTimeoutRef.current === "number") {
        clearTimeout(copiedTimeoutRef.current);
      }

      setCopied(true);

      copy(getData(), { format: "text/plain" });

      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
    };

    const onFocus = (event: FocusEvent<HTMLInputElement>) => {
      if (enableCopy && type !== "password") {
        event.target.select();
      }

      _onFocus?.(event);
    };

    return (
      <FormControl variant="standard" fullWidth {...formControlProps}>
        {!!label && !hideLabel && (
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
          type={copied || revealed ? "text" : type}
          value={copied ? "Copied" : value}
          error={!!error}
          readOnly={readOnly || enableCopy}
          inputRef={inputRef}
          inputProps={{
            ...inputProps,
            sx:
              isMonospace && !copied
                ? { ...inputProps?.sx, fontFamily: monospaceFontFamily }
                : inputProps?.sx,
          }}
          onFocus={onFocus}
          endAdornment={
            <>
              {endAdornment}
              {type === "password" && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Reveal"
                    onClick={onToggleReveal}
                    edge="end"
                  >
                    {revealed ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )}
              {enableQr && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Show QR code"
                    edge="end"
                    component={NextLinkComposed}
                    to={{
                      pathname: "/qr",
                      query: {
                        data: getData(),
                        title: typeof label === "string" ? label : undefined,
                      },
                    }}
                    target="_blank"
                  >
                    <QrCode2 />
                  </IconButton>
                </InputAdornment>
              )}
              {enableCopy && (
                <InputAdornment position="end">
                  <IconButton aria-label="Copy" onClick={onCopy} edge="end">
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
  }
);

TextField.displayName = "TextField";
