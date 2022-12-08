import { ElementType } from "react";
import { NextLinkComposedProps } from "../Link";
import { Button as MuiButton, ButtonProps } from "@mui/material";

type Props<C extends React.ElementType> = ButtonProps &
  Partial<NextLinkComposedProps> & {
    component?: C;
  };

export const Button = <C extends ElementType>({
  variant = "contained",
  disabled,
  ...props
}: Props<C>) => (
  <MuiButton
    variant={disabled ? "outlined" : variant}
    disabled={disabled}
    {...props}
  />
);
