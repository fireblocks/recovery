import React, { ElementType } from "react";
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from "@mui/material";
import { NextLinkComposedProps } from "../Link";

export type ButtonProps<C extends ElementType = "button"> = MuiButtonProps &
  Partial<Omit<NextLinkComposedProps, "onClick">> & {
    component?: C;
  };

export function Button<C extends ElementType>({
  variant = "contained",
  disabled,
  ...props
}: ButtonProps<C>) {
  return (
    <MuiButton
      variant={disabled ? "outlined" : variant}
      disabled={disabled}
      {...props}
    />
  );
}
