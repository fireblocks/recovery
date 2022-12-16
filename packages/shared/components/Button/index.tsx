import React, { ElementType } from "react";
import { NextLinkComposedProps } from "../Link";
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from "@mui/material";

export type ButtonProps<C extends ElementType = "button"> = MuiButtonProps &
  Partial<Omit<NextLinkComposedProps, "onClick">> & {
    component?: C;
  };

export const Button = <C extends ElementType>({
  variant = "contained",
  disabled,
  ...props
}: ButtonProps<C>) => (
  <MuiButton
    variant={disabled ? "outlined" : variant}
    disabled={disabled}
    {...props}
  />
);
