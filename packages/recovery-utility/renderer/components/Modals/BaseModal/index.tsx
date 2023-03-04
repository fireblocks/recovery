import { useId, ReactNode, ComponentType, Fragment } from "react";
import {
  Dialog,
  DialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

type Props = Omit<DialogProps, "onClose"> & {
  title?: ReactNode;
  actions?: ReactNode;
  WrapperComponent?: ComponentType<{ children: ReactNode }>;
  onClose: VoidFunction;
};

export const BaseModal = ({
  title,
  actions,
  WrapperComponent = Fragment,
  scroll = "paper",
  PaperProps,
  onClose,
  children,
  ...props
}: Props) => {
  const titleId = useId();

  return (
    <Dialog
      {...props}
      aria-labelledby={title ? titleId : undefined}
      scroll={scroll}
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", ...PaperProps?.sx },
      }}
      onClose={onClose}
    >
      <WrapperComponent>
        {!!title && (
          <DialogTitle
            id={titleId}
            sx={{
              background: "#FFF",
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {typeof title === "string" ? (
              <Typography variant="h1">{title}</Typography>
            ) : (
              title
            )}
            <IconButton aria-label="Close modal" edge="end" onClick={onClose}>
              <Close />
            </IconButton>
          </DialogTitle>
        )}
        <DialogContent sx={{ marginTop: "1em" }}>{children}</DialogContent>
        {!!actions && (
          <DialogActions sx={{ padding: "1.75em" }}>{actions}</DialogActions>
        )}
      </WrapperComponent>
    </Dialog>
  );
};
